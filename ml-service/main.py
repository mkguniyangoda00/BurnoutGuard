from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import sys
import numpy as np
from chat_engine import generate_reply

from preprocess import build_feature_vector, load_latest_artifacts, INT_TO_RISK
from explain import explain_prediction, apply_calibrated_probabilities

load_dotenv()

app = Flask(__name__)
CORS(app)

_artifacts = None


def get_artifacts():
    global _artifacts
    if _artifacts is None:
        _artifacts = load_latest_artifacts()
        if _artifacts is None:
            raise RuntimeError(
                "No trained model found. Run `python train.py` first "
                "(after `python generate_dataset.py` if dataset.csv doesn't exist)."
            )
    return _artifacts


@app.route('/')
def index():
    return jsonify({"status": "ML Service is running"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json or {}
    raw_features = data.get("features", {})

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
            "error": f"Model/feature mismatch: {str(e)}. FEATURE_COLUMNS changed since the "
                     f"model was last trained — run `python generate_dataset.py && python train.py`."
        }), 500

    predicted_class = int(model.predict(scaled)[0])
    calibrated = apply_calibrated_probabilities(model, scaled, calibrators)
    proba = calibrated if calibrated is not None else model.predict_proba(scaled)[0]
    risk_score = float(proba[predicted_class])
    risk_level = INT_TO_RISK[predicted_class]

    background = artifacts.get("background")
    shap_values = explain_prediction(model, scaler, feature_df, predicted_class, background)
    uncertainty = float(1.0 - np.max(proba))

    return jsonify({
        "riskScore": round(risk_score, 4),
        "probabilities": {level: round(float(proba[idx]), 4) for idx, level in enumerate(metadata.get("riskLevels", []))},
        "uncertainty": round(uncertainty, 4),
        "riskLevel": risk_level,
        "modelVersion": metadata["version"],
        "shapValues": shap_values,
    })

@app.route('/whatif', methods=['POST'])
def whatif():
    data = request.json or {}
    baseline = data.get("features", {})
    modifications = data.get("modifications", {})

    merged = {**baseline, **modifications}

    artifacts = get_artifacts()
    model = artifacts["model"]
    scaler = artifacts["scaler"]
    calibrators = artifacts.get("calibrators")

    feature_df = build_feature_vector(merged)
    scaled = scaler.transform(feature_df)

    predicted_class = int(model.predict(scaled)[0])
    proba = apply_calibrated_probabilities(model, scaled, calibrators)
    risk_score = float(proba[predicted_class])
    risk_level = INT_TO_RISK[predicted_class]

    return jsonify({
        "riskScore": round(risk_score, 4),
        "riskLevel": risk_level,
        "probabilities": {level: round(float(proba[idx]), 4) for idx, level in enumerate(["Low", "Moderate", "High", "Critical"])},
    })


@app.route('/retrain', methods=['POST'])
def retrain():
    import subprocess
    script_dir = os.path.dirname(os.path.abspath(__file__))
    result = subprocess.run(
        [sys.executable, "train.py"],
        capture_output=True, text=True,
        cwd=script_dir,
    )
    global _artifacts
    _artifacts = None
    if result.returncode != 0:
        print("[retrain] STDOUT:", result.stdout)
        print("[retrain] STDERR:", result.stderr)
    return jsonify({
        "success": result.returncode == 0,
        "log": (result.stdout + result.stderr)[-4000:],
    })
    
    
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    history = data.get("history", [])
    context_summary = data.get("contextSummary", "no prediction data available yet")

    if not isinstance(history, list):
        return jsonify({"error": "history must be a list"}), 400

    try:
        reply = generate_reply(history, context_summary)
    except Exception as e:
        return jsonify({"error": f"chat engine failed: {str(e)}"}), 500

    return jsonify({"reply": reply, "engine": "tensorflow"})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
