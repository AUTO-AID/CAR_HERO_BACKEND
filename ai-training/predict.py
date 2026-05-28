import sys
import json
import pickle
import os
import numpy as np

def main():
    try:
        # Load pickle model
        model_path = os.path.join(os.path.dirname(__file__), 'models/provider_recommendation_model.pkl')
        if not os.path.exists(model_path):
            print(json.dumps({"error": f"Pickle model not found at {model_path}"}))
            sys.exit(1)
            
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            
        # Read candidates from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
            
        candidates = json.loads(input_data)
        if not candidates:
            print(json.dumps({"predictions": []}))
            return
            
        # Prepare feature matrix
        # Features order must match X columns exactly:
        # ['distance', 'rating', 'serviceMatch', 'workingHours', 'emergencySupport', 
        #  'expectedResponseTime', 'completedOrders', 'cancellationRate', 'cityMatch', 'urgencyAlignment']
        feature_names = [
            'distance', 'rating', 'serviceMatch', 'workingHours', 'emergencySupport',
            'expectedResponseTime', 'completedOrders', 'cancellationRate', 'cityMatch', 'urgencyAlignment'
        ]
        
        X = []
        for c in candidates:
            row = [float(c.get(f, 0.5)) for f in feature_names]
            X.append(row)
            
        # Predict probabilities of class 1 (successfulRecommendation)
        probabilities = model.predict_proba(X)[:, 1]
        
        results = []
        for i, prob in enumerate(probabilities):
            results.append({
                "providerId": candidates[i].get("providerId"),
                "score": float(np.round(prob * 100, 2))
            })
            
        print(json.dumps({"predictions": results}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
