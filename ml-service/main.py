from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

from preprocess import build_feature_vector, load_latest_artifacts, INT_TO_RISK
from explain import explain_prediction

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

    feature_df = build_feature_vector(raw_features)
    scaled = scaler.transform(feature_df)

    predicted_class = int(model.predict(scaled)[0])
    proba = model.predict_proba(scaled)[0]
    risk_score = float(proba[predicted_class])
    risk_level = INT_TO_RISK[predicted_class]

    shap_values = explain_prediction(model, scaler, feature_df, predicted_class)

    return jsonify({
        "riskScore": round(risk_score, 4),
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

    feature_df = build_feature_vector(merged)
    scaled = scaler.transform(feature_df)

    predicted_class = int(model.predict(scaled)[0])
    proba = model.predict_proba(scaled)[0]
    risk_score = float(proba[predicted_class])
    risk_level = INT_TO_RISK[predicted_class]

    return jsonify({
        "riskScore": round(risk_score, 4),
        "riskLevel": risk_level,
    })


@app.route('/retrain', methods=['POST'])
def retrain():
    import subprocess
    result = subprocess.run(["python", "train.py"], capture_output=True, text=True)
    global _artifacts
    _artifacts = None  # force reload of new artifacts on next request
    return jsonify({
        "success": result.returncode == 0,
        "log": result.stdout + result.stderr,
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)