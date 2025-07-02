from flask import Flask, render_template, jsonify,request
from backend.db import init_db
init_db()
import json
import os
import pandas as pd
import sqlite3

app = Flask(__name__)

@app.route('/')
def home():
    print("Home route triggered")
    return render_template('walkability.html')

@app.route('/api/scores')
def get_scores():
    with open('static/scores.json', 'r') as f:
        scores = json.load(f)
    return jsonify(scores)
@app.route('/update_location', methods=['POST'])
def update_location():
    data = request.get_json()
    lat = data['lat']
    lng = data['lng']
    print(f"User location received: {lat}, {lng}")

    # Later: Replace with real score logic
    score = {
        "sidewalk": 70,
        "greenery": 60,
        "air": 80,
        "safety": 65
    }
    return jsonify(score)
@app.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    name = request.form.get("name")
    message = request.form.get("message")

    with open("feedback_data.json", "a") as f:
        f.write(json.dumps({"name": name, "message": message}) + "\n")

    return "<script>alert('Thank you for your feedback!'); window.location.href='/feedback';</script>"
@app.route('/api/walkability-data')
def walkability_data():
    # Get latitude and longitude from the request
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)

# Mock data for walkability scores
    mock_scores = {
        "sidewalk": 72,
        "greenery": 85,
        "lighting": 65,
        "air": 78,
        "safety": 90
    }

    print(f"Received coordinates: lat={lat}, lng={lng}")
    return jsonify(mock_scores)

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
