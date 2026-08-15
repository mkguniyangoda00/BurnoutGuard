"""
chat_engine.py

Lightweight TensorFlow-backed conversational engine used as a research
comparison point against the hosted LLM (LlmService.ts) and the
rule-based fallback (ChatService.buildReply) — see thesis evaluation
chapter for the three-way engine comparison. Not intended to replace
either path in production.

Uses a small pretrained causal LM (DistilGPT2 by default) via Hugging
Face transformers with a TensorFlow backend. No fine-tuning is performed
by default; set TF_CHAT_MODEL to a fine-tuned checkpoint path if one
becomes available later.
"""

import os
from functools import lru_cache

MODEL_NAME = os.getenv("TF_CHAT_MODEL", "distilgpt2")
MAX_NEW_TOKENS = 120
MAX_HISTORY_TURNS = 6  # keeps prompt length (and latency) bounded


@lru_cache(maxsize=1)
def _load_model():
    """Lazily loads the tokenizer/model once per process — avoids paying
    the load cost on every request, and avoids paying it at all for
    deployments that never call this engine (e.g. CHATBOT_ENGINE=llm)."""
    from transformers import AutoTokenizer, TFAutoModelForCausalLM

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = TFAutoModelForCausalLM.from_pretrained(MODEL_NAME)
    return tokenizer, model


def _build_prompt(history: list, context_summary: str) -> str:
    """DistilGPT2 has no native chat template, so turns are joined with
    simple role prefixes into a plain-text prompt."""
    lines = [f"[Context: {context_summary}]"]
    for turn in history[-MAX_HISTORY_TURNS:]:
        speaker = "Developer" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{speaker}: {turn.get('content', '')}")
    lines.append("Assistant:")
    return "\n".join(lines)


def generate_reply(history: list, context_summary: str) -> str:
    """
    history: list of {"role": "user"|"assistant", "content": str}, same
             shape as backend/src/services/LlmService.ts's
             LlmConversationMessage.
    context_summary: pre-sanitized aggregate context string — same
             sanitization contract as LlmService.buildSanitizedContextSummary
             (no userId/email/name, aggregate signals only).
    """
    if not history:
        return "I'm here whenever you'd like to talk."

    tokenizer, model = _load_model()
    prompt = _build_prompt(history, context_summary)

    inputs = tokenizer(prompt, return_tensors="tf", truncation=True, max_length=512)
    output_ids = model.generate(
        inputs["input_ids"],
        attention_mask=inputs["attention_mask"],
        max_new_tokens=MAX_NEW_TOKENS,
        do_sample=True,
        top_p=0.9,
        temperature=0.8,
        pad_token_id=tokenizer.pad_token_id,
    )

    generated = tokenizer.decode(
        output_ids[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    )

    # Trim if the model runs on past its own turn.
    for marker in ("\nDeveloper:", "\nAssistant:"):
        if marker in generated:
            generated = generated.split(marker)[0]

    reply = generated.strip()
    return reply if reply else "Could you tell me a bit more about that?"