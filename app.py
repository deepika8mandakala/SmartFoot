from flask import Flask, render_template, jsonify,request
from flask_cors import CORS  # 👈 New import for CORS support
# from backend.db import init_db
# init_db()
import traceback
import json
import os
import pandas as pd
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
def get_csv_path():
    """Get absolute path to the CSV file"""
    return os.path.join(os.path.dirname(__file__), 'data', 'safety_scores_full.csv')

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

    # 🔧 Replace this mock data with real analysis later
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

    
    # Your existing POST handling code
# API to get matching routes based on from & to

@app.route("/api/get-safety-scores", methods=["POST", "GET", "OPTIONS"])
def get_safety_scores():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    try:
        data = request.get_json(force=True) if request.method == "POST" else request.args
        print ("recieved",data) 

        from_loc = data.get("from", "").strip().lower()
        to_loc = data.get("to", "").strip().lower()

        if not from_loc or not to_loc:
            return jsonify({"error": "Missing parameters"}), 400
        
        return jsonify({"score":88})
        # Load and inspect the CSV
        csv_path = os.path.join(os.path.dirname(__file__), "data", "safety_scores_full.csv")
        print("CSV Path:", csv_path)
        df = pd.read_csv(csv_path, sep=",", engine='python')


        print("CSV Loaded Successfully!")

        # Ensure required columns exist
        expected_cols = ["from_location", "to_location", "summary", "safetyScore", "waypoints"]
        for col in expected_cols:
            if col not in df.columns:
                raise ValueError(f"Missing column in CSV: {col}")

        # Normalize for matching
        df['from_clean'] = df['from_location'].str.strip().str.lower()
        df['to_clean'] = df['to_location'].str.strip().str.lower()

        # Match routes
        matches = df[
            ((df['from_location'] == from_loc) & (df['to_location'] == to_loc)) |
            ((df['from_location'] == to_loc) & (df['to_location'] == from_loc))
        ]

        if matches.empty:
            return jsonify({
                "error": "No routes found",
                "message": f"No routes between {from_loc.title()} and {to_loc.title()}"
            }), 404

        routes = matches[["from_location", "to_location", "summary", "safetyScore", "waypoints"]].to_dict(orient="records")

        return jsonify({"success": True, "routes": routes})

    except Exception as e:
        print("Server error:", str(e))
        traceback.print_exc()  # This will give the full error log
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=8000)
# This will start the Flask app and make it accessible on all interfaces at port 8000
