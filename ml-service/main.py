from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"status": "ML Service is running"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # Placeholder for prediction logic
    return jsonify({"prediction": "low_risk", "probability": 0.1})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
