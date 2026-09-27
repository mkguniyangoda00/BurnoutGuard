from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import threading
import subprocess
import traceback
from datetime import datetime, timezone

import numpy as np
from dotenv import load_dotenv

from preprocess import build_feature_vector, load_latest_artifacts, INT_TO_RISK, RISK_LEVELS
from explain import explain_prediction, apply_calibrated_probabilities

load_dotenv()

app = Flask(__name__)
CORS(app)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# run_experiment.py is the script that actually writes models/metadata.json
# in the format load_latest_artifacts() reads. Override with RETRAIN_SCRIPT if needed.
RETRAIN_SCRIPT = os.getenv("RETRAIN_SCRIPT", "run_experiment.py")

_artifacts = None
_artifacts_error = None
_artifacts_lock = threading.Lock()

_retrain_state = {
    "running": False,
    "startedAt": None,
    "finishedAt": None,
    "success": None,
    "log": "",
}
_retrain_lock = threading.Lock()


class ModelNotReady(Exception):
    pass


def get_artifacts():
    """Load model artifacts once; raise ModelNotReady with a clear reason on failure."""
    global _artifacts, _artifacts_error
    with _artifacts_lock:
        if _artifacts is not None:
            return _artifacts
        try:
            loaded = load_latest_artifacts()
        except Exception as e:  # corrupt pickle, missing file referenced by metadata, version mismatch...
            _artifacts_error = f"Failed to load model artifacts: {type(e).__name__}: {e}"
            raise ModelNotReady(_artifacts_error)
        if loaded is None:
            _artifacts_error = (
                "No trained model found (models/metadata.json missing). "
                f"Run `python {RETRAIN_SCRIPT}` or trigger a retrain from the admin page."
            )
            raise ModelNotReady(_artifacts_error)
        _artifacts = loaded
        _artifacts_error = None
        return _artifacts


def reset_artifacts():
    global _artifacts, _artifacts_error
    with _artifacts_lock:
        _artifacts = None
        _artifacts_error = None


@app.errorhandler(ModelNotReady)
def handle_model_not_ready(e):
    return jsonify({"error": str(e), "modelReady": False}), 503


@app.errorhandler(Exception)
def handle_unexpected(e):
    traceback.print_exc()
    return jsonify({"error": f"{type(e).__name__}: {e}"}), 500


def _probabilities(model, scaled, calibrators):
    proba = apply_calibrated_probabilities(model, scaled, calibrators)
    if proba is None:
        proba = model.predict_proba(scaled)[0]
    return np.asarray(proba, dtype=float)


@app.route('/')
def index():
    return jsonify({"status": "ML Service is running"})


@app.route('/health')
def health():
    try:
        artifacts = get_artifacts()
        return jsonify({
            "status": "ok",
            "modelReady": True,
            "modelVersion": artifacts["metadata"].get("version"),
            "retraining": _retrain_state["running"],
        })
    except ModelNotReady as e:
        return jsonify({
            "status": "degraded",
            "modelReady": False,
            "error": str(e),
            "retraining": _retrain_state["running"],
        }), 503


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True) or {}
    raw_features = data.get("features", {}) or {}

    artifacts = get_artifacts()
    model = artifacts["model"]
    scaler = artifacts["scaler"]
    metadata = artifacts["metadata"]
    calibrators = artifacts.get("calibrators")

    feature_df = build_feature_vector(raw_features)

    try:
        scaled = scaler.transform(feature_df)
    except ValueError as e:
        return jsonify({
            "error": f"Model/feature mismatch: {e}. FEATURE_COLUMNS changed since the model "
                     f"was last trained. Retrain the model."
        }), 500

    predicted_class = int(model.predict(scaled)[0])
    proba = _probabilities(model, scaled, calibrators)
    risk_levels = metadata.get("riskLevels") or RISK_LEVELS

    # SHAP is a nice-to-have: never let it block the risk prediction itself.
    try:
        shap_values = explain_prediction(model, scaler, feature_df, predicted_class, artifacts.get("background"))
    except Exception as e:
        print(f"[predict] SHAP explanation failed, returning prediction without it: {e}")
        shap_values = []

    return jsonify({
        "riskScore": round(float(proba[predicted_class]), 4),
        "probabilities": {level: round(float(proba[i]), 4) for i, level in enumerate(risk_levels) if i < len(proba)},
        "uncertainty": round(float(1.0 - np.max(proba)), 4),
        "riskLevel": INT_TO_RISK[predicted_class],
        "modelVersion": metadata.get("version", "unknown"),
        "shapValues": shap_values,
    })


@app.route('/whatif', methods=['POST'])
def whatif():
    data = request.get_json(silent=True) or {}
    baseline = data.get("features", {}) or {}
    modifications = data.get("modifications", {}) or {}
    merged = {**baseline, **modifications}

    artifacts = get_artifacts()
    model = artifacts["model"]
    scaled = artifacts["scaler"].transform(build_feature_vector(merged))

    predicted_class = int(model.predict(scaled)[0])
    proba = _probabilities(model, scaled, artifacts.get("calibrators"))

    return jsonify({
        "riskScore": round(float(proba[predicted_class]), 4),
        "riskLevel": INT_TO_RISK[predicted_class],
        "probabilities": {level: round(float(proba[i]), 4) for i, level in enumerate(RISK_LEVELS) if i < len(proba)},
    })


def _run_retrain():
    script_path = os.path.join(SCRIPT_DIR, RETRAIN_SCRIPT)
    try:
        if not os.path.exists(script_path):
            raise FileNotFoundError(f"Retrain script not found: {script_path}")
        result = subprocess.run(
            [sys.executable, RETRAIN_SCRIPT],
            capture_output=True, text=True, cwd=SCRIPT_DIR,
        )
        success = result.returncode == 0
        log = (result.stdout + result.stderr)[-4000:]
        if not success:
            print("[retrain] FAILED\n", log)
    except Exception as e:
        success = False
        log = f"{type(e).__name__}: {e}"
        print("[retrain] FAILED\n", log)

    if success:
        reset_artifacts()
        try:
            get_artifacts()  # verify the new model actually loads
        except ModelNotReady as e:
            success = False
            log += f"\n\nTraining finished but the new model could not be loaded: {e}"

    with _retrain_lock:
        _retrain_state.update({
            "running": False,
            "success": success,
            "finishedAt": datetime.now(timezone.utc).isoformat(),
            "log": log,
        })


@app.route('/retrain', methods=['POST'])
def retrain():
    """Starts retraining in the background and returns immediately.
    Training on the full dataset takes far longer than any HTTP timeout."""
    with _retrain_lock:
        if _retrain_state["running"]:
            return jsonify({"success": False, "running": True,
                            "log": "A retrain is already in progress."}), 409
        _retrain_state.update({
            "running": True,
            "success": None,
            "startedAt": datetime.now(timezone.utc).isoformat(),
            "finishedAt": None,
            "log": "",
        })
    threading.Thread(target=_run_retrain, daemon=True).start()
    return jsonify({"success": True, "running": True,
                    "log": f"Retraining started ({RETRAIN_SCRIPT}). Check /retrain/status for progress."}), 202


@app.route('/retrain/status', methods=['GET'])
def retrain_status():
    with _retrain_lock:
        return jsonify(dict(_retrain_state))


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True) or {}
    history = data.get("history", [])
    context_summary = data.get("contextSummary", "no prediction data available yet")

    if not isinstance(history, list):
        return jsonify({"error": "history must be a list"}), 400

    # Imported lazily: a TensorFlow import failure must not take down /predict and /retrain.
    try:
        from chat_engine import generate_reply
    except Exception as e:
        return jsonify({"error": f"chat engine unavailable: {e}"}), 503

    try:
        reply = generate_reply(history, context_summary)
    except Exception as e:
        return jsonify({"error": f"chat engine failed: {e}"}), 500

    return jsonify({"reply": reply, "engine": "tensorflow"})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    try:
        get_artifacts()
        print(f"[startup] Model loaded: {_artifacts['metadata'].get('version')}")
    except ModelNotReady as e:
        print(f"[startup] WARNING: {e}")
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)