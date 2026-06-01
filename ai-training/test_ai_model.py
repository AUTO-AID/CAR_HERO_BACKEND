import os
import sys
import pickle
import numpy as np

def main():
    model_path = os.path.join(os.path.dirname(__file__), 'models/provider_recommendation_model.pkl')
    
    if not os.path.exists(model_path):
        print(f"Error: Pickle model not found at {model_path}")
        sys.exit(1)
        
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Features order:
    # ['distance', 'rating', 'serviceMatch', 'workingHours', 'emergencySupport', 
    #  'expectedResponseTime', 'completedOrders', 'cancellationRate', 'cityMatch', 'urgencyAlignment']
    
    scenarios = [
        {
            "name": "1. Perfect Provider (The ideal candidate)",
            "features": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        },
        {
            "name": "2. Absolute Worst Provider (Terrible in everything)",
            "features": [0.05, 0.1, 0.1, 0.1, 0.0, 0.1, 0.2, 0.1, 0.1, 0.1]
        },
        {
            "name": "3. Close Location but Terrible Service (Near but bad)",
            "features": [1.0, 0.2, 0.5, 1.0, 0.0, 0.5, 0.2, 0.1, 1.0, 1.0]
        },
        {
            "name": "4. Far Location but Excellent Service (Far but trusted)",
            "features": [0.1, 1.0, 1.0, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0]
        },
        {
            "name": "5. Emergency Mismatch (Good provider but no emergency support for urgent task)",
            "features": [0.9, 0.9, 0.9, 0.9, 0.0, 0.8, 0.9, 0.9, 0.9, 0.1]
        },
        {
            "name": "6. Good but Currently Closed (Great provider but working hours don't match)",
            "features": [1.0, 0.9, 1.0, 0.1, 1.0, 0.8, 0.9, 0.9, 1.0, 1.0]
        },
        {
            "name": "7. Perfect but 100% Cancellation Rate (Always cancels)",
            "features": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0]
        },
        {
            "name": "8. Average Provider (Middle of the road)",
            "features": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        }
    ]

    print("==========================================================")
    print("AI Recommendation Model - Stress Tests & Assertions")
    print("==========================================================\n")
    
    for scenario in scenarios:
        features = np.array(scenario["features"]).reshape(1, -1)
        prob = model.predict_proba(features)[:, 1][0]
        score = np.round(prob * 100, 2)
        
        print(f"Scenario: {scenario['name']}")
        print(f"Features: {scenario['features']}")
        print(f"AI Predicted Score (Match Probability): {score}%")
        
        # Simple logical assertions based on the test name
        if "Perfect Provider" in scenario['name']:
            print("Status: ✅ PASS" if score > 80 else "Status: ❌ FAIL (Expected > 80%)")
        elif "Worst Provider" in scenario['name']:
            print("Status: ✅ PASS" if score < 30 else "Status: ❌ FAIL (Expected < 30%)")
        elif "Close Location but Terrible" in scenario['name']:
            print("Status: ✅ PASS" if score < 60 else "Status: ❌ FAIL (Expected < 60%)")
        elif "Closed" in scenario['name'] or "Cancellation" in scenario['name'] or "Mismatch" in scenario['name']:
            print("Status: ✅ PASS" if score < 75 else "Status: ❌ FAIL (Expected significant penalty)")
            
        print("-" * 50)

if __name__ == '__main__':
    main()
