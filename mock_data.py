import json
import random

# List of indicators with display names and matching categories
indicators = {
    "sidewalk_width": "Sidewalk Width",
    "pavement_quality": "Pavement Quality",
    "lighting": "Lighting",
    "park": "Park",
    "greenery": "Greenery",
    "air_quality": "Air Quality",
    "thermal_comfort": "Thermal Comfort",
    "attractiveness": "Attractiveness",
    "low_traffic": "Low Traffic",
    "pedestrian_areas": "Pedestrian Areas",
    "slope": "Slope"
}

# Generate mock data for each indicator (0-100 scale)
mock_scores = {}
for key in indicators:
    mock_scores[key] = round(random.uniform(40, 95), 1)  # semi-optimized range

# Save the data as JSON
with open("static/scores.json", "w") as f:
    json.dump(mock_scores, f, indent=4)

print("Mock walkability scores generated and saved to scores.json")
