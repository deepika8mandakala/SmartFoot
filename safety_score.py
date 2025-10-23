"""
SmartFoot Safety Score Calculator
---------------------------------
This module calculates a Safety Score (0–100) for an area
based on environmental and infrastructural safety factors.

Author: Deepika Mandakala
Project: SmartFoot - AI-Powered Walkability Analytics
"""

def calculate_safety_score(data):
    """
    Calculate safety score based on input parameters.

    Parameters (each value 0–10 scale unless noted):
        lighting_quality      → Streetlight brightness/availability
        cctv_coverage         → CCTV presence coverage percentage (normalized)
        police_stations       → No. of nearby police stations (normalized)
        road_visibility       → Visibility of road (less blind spots)
        crime_rate            → Reported crimes per km² (lower = better)
        accident_rate         → Traffic accidents per km² (lower = better)
        traffic_speed         → Avg. vehicle speed (km/h) (lower = better)
        pedestrian_density    → No. of pedestrians per 100 m

    Returns:
        Safety Score (0–100)
    """

    try:
        # Extract parameters
        Lq = data.get('lighting_quality', 5)
        Cc = data.get('cctv_coverage', 5)
        Ps = data.get('police_stations', 5)
        Rv = data.get('road_visibility', 5)
        Cr = data.get('crime_rate', 5)
        Ar = data.get('accident_rate', 5)
        Ts = data.get('traffic_speed', 5)
        Pd = data.get('pedestrian_density', 5)

        # Formula: Weighted sum (higher = safer)
        score = (
            (0.25 * Lq) +
            (0.15 * Cc) +
            (0.10 * Ps) +
            (0.10 * Rv) +
            (0.15 * (10 - Cr)) +
            (0.10 * (10 - Ar)) +
            (0.10 * (10 - Ts)) +
            (0.05 * Pd)
        ) * 10

        return round(score, 2)
    
    except Exception as e:
        print("Error calculating safety score:", e)
        return None


# --------------------------------------------------------
# Example Usage (for testing)
# --------------------------------------------------------
if __name__ == "__main__":
    sample_data = {
        "lighting_quality": 8,
        "cctv_coverage": 6,
        "police_stations": 5,
        "road_visibility": 7,
        "crime_rate": 3,
        "accident_rate": 4,
        "traffic_speed": 6,
        "pedestrian_density": 7
    }

    score = calculate_safety_score(sample_data)
    print(f" Calculated Safety Score: {score}/100")
