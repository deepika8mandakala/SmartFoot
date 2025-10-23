import joblib
import numpy as np

# Load model
model = joblib.load('xgboost_walkability_model.pkl')

def predict_walkability(features):
    """
    features: dict containing the following keys:
        sidewalk_width, pavement_quality, green_cover,
        traffic_density, noise_level, air_quality_index,
        lighting_quality, crime_rate
    """
    X_input = np.array([[
        features['sidewalk_width'],
        features['pavement_quality'],
        features['green_cover'],
        features['traffic_density'],
        features['noise_level'],
        features['air_quality_index'],
        features['lighting_quality'],
        features['crime_rate']
    ]])
    
    score = model.predict(X_input)[0]
    return round(float(score), 2)
