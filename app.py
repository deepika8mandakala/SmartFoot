import os
from flask import Flask, render_template, jsonify, request, send_from_directory
from backend.db import init_db
init_db()
import json
import pandas as pd
import sqlite3

app = Flask(__name__)

@app.route('/')
def home():
    print("Home route triggered")
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'walkability.html')

@app.route('/home.html')
def home_dashboard():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'home.html')

@app.route('/api/scores')
def get_scores():
    with open('static/scores.json', 'r') as f:
        scores = json.load(f)
    return jsonify(scores)
@app.route('/update_location', methods=['POST'])
def update_location():
    data = request.get_json()
    lat = float(data['lat'])
    lng = float(data['lng'])
    print(f"User location received: {lat}, {lng}")
    from predict_walkability import predict_bundle
    bundle = predict_bundle(lat, lng)
    return jsonify({
        "sidewalk": bundle['factors'][2]['score'],
        "greenery": bundle['factors'][1]['score'],
        "air": bundle['factors'][3]['score'],
        "safety": bundle['factors'][5]['score'],
        "overall": bundle['overall'],
    })
@app.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    name = request.form.get("name")
    message = request.form.get("message")

    with open("feedback_data.json", "a") as f:
        f.write(json.dumps({"name": name, "message": message}) + "\n")

    return "<script>alert('Thank you for your feedback!'); window.location.href='/feedback';</script>"
@app.route('/api/walkability-data')
def walkability_data():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    if lat is None or lng is None:
        return jsonify({"error": "lat and lng query params required"}), 400
    from predict_walkability import predict_bundle
    bundle = predict_bundle(lat, lng)
    f = {x['key']: x['score'] for x in bundle['factors']}
    print(f"Walkability API: lat={lat}, lng={lng}, overall={bundle['overall']}")
    return jsonify({
        "sidewalk": f['footpath'],
        "greenery": f['greenery'],
        "lighting": f['lighting'],
        "air": f['air-quality'],
        "safety": f['landmarks'],
        "overall": bundle['overall'],
    })


@app.route('/api/predict-walkability', methods=['POST'])
def api_predict_walkability():
    """Full map UI: XGBoost overall score + factor breakdown."""
    try:
        data = request.get_json(silent=True) or {}
        lat = float(data.get('lat'))
        lng = float(data.get('lng'))
    except (TypeError, ValueError):
        return jsonify({"error": "JSON body must include numeric lat and lng"}), 400
    try:
        from predict_walkability import predict_bundle
        return jsonify(predict_bundle(lat, lng))
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        print("predict-walkability error:", e)
        return jsonify({"error": "Prediction failed"}), 500

@app.route("/admin")
def admin():
    conn = sqlite3.connect('walkability.db')
    c = conn.cursor()
    c.execute("SELECT * FROM feedback ORDER BY timestamp DESC")
    data = c.fetchall()
    conn.close()
    return render_template("admin.html", feedback=data)
@app.route("/leaderboard")
def leaderboard():
    conn = sqlite3.connect('walkability.db')
    c = conn.cursor()
    c.execute("SELECT location, AVG(total_score) FROM feedback GROUP BY location ORDER BY AVG(total_score) DESC")
    leaderboard = c.fetchall()
    conn.close()
    return render_template("leaderboard.html", leaderboard=leaderboard)
# Render the route planner page
@app.route("/safe-route")
def safe_route():
    return render_template("safe-route.html")

# API to get matching routes based on from & to
@app.route("/api/get-safety-scores", methods=["POST"])
def get_safety_scores():
    try:
        data = request.get_json()
        from_loc = data.get("from", "").strip().lower()
        to_loc = data.get("to", "").strip().lower()

        df = pd.read_csv("data/safety_scores_full.csv")
        df['from_location'] = df['from_location'].str.strip().str.lower()
        df['to_location'] = df['to_location'].str.strip().str.lower()

        matches = df[
            (df['from_location'] == from_loc) &
            (df['to_location'] == to_loc)
        ]

        return jsonify(matches.to_dict(orient="records"))

    except Exception as e:
        print("❌ Backend Error:", e)
        return jsonify({"error": "Server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
