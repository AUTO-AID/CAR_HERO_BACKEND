import os
import sys
import numpy as np
from pymongo import MongoClient
from bson import ObjectId

def read_env_file():
    env_vars = {}
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env'))
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                trimmed = line.strip()
                if trimmed and not trimmed.startswith('#') and '=' in trimmed:
                    parts = trimmed.split('=', 1)
                    env_vars[parts[0].strip()] = parts[1].strip()
    return env_vars

def main():
    env_vars = read_env_file()
    uri = env_vars.get('MONGODB_URI') or env_vars.get('MONGODB_URI_GLOBAL')
    
    if not uri:
        print("[ERROR] MONGODB_URI not found in .env")
        sys.exit(1)
        
    client = MongoClient(uri)
    db = client.get_default_database()
    collection = db['ai_recommendation_logs']
    
    # Clean previous synthetic data
    res = collection.delete_many({"modelType": "synthetic"})
    print(f"Deleted {res.deleted_count} old synthetic records.")
    
    print("Generating 2500 nuanced synthetic logs to sharpen the ML model...")
    synthetic_logs = []
    
    # We will generate 1000 Successes and 1500 Nuanced Failures
    for i in range(2500):
        fake_provider_id = ObjectId()
        log = {
            "criteria": {
                "serviceCategory": "towing",
                "city": "TestCity",
                "location": {"lat": 24.0, "lng": 46.0},
                "urgencyLevel": "emergency"
            },
            "candidateCount": 1,
            "status": "success",
            "modelType": "synthetic",
            "modelVersion": "v3"
        }
        
        breakdown = {}
        
        if i < 1000:
            # --- SUCCESS SCENARIOS (1000) ---
            # Good provider scenario (Success)
            breakdown = {
                'distance': np.random.uniform(0.7, 1.0),
                'rating': np.random.uniform(0.7, 1.0),
                'serviceMatch': np.random.uniform(0.7, 1.0),
                'workingHours': np.random.uniform(0.8, 1.0),
                'emergencySupport': np.random.choice([0.0, 1.0], p=[0.2, 0.8]),
                'expectedResponseTime': np.random.uniform(0.7, 1.0),
                'completedOrders': np.random.uniform(0.6, 1.0),
                'cancellationRate': np.random.uniform(0.8, 1.0),
                'cityMatch': 1.0,
                'urgencyAlignment': np.random.uniform(0.7, 1.0)
            }
            log["chosenProvider"] = fake_provider_id # Marks as success!
            
        else:
            # --- FAILURE SCENARIOS (1500) ---
            # We purposely do NOT set log["chosenProvider"] = fake_provider_id, 
            # so train_model.py treats it as 0 (Failed).
            
            # Divide failures into specific "traps" so the model learns edge cases
            trap_type = (i - 1000) % 5
            
            if trap_type == 0:
                # 1. Absolute Terrible
                breakdown = {
                    'distance': np.random.uniform(0.0, 0.4),
                    'rating': np.random.uniform(0.0, 0.5),
                    'serviceMatch': np.random.uniform(0.1, 0.6),
                    'workingHours': np.random.uniform(0.0, 0.4),
                    'emergencySupport': 0.0,
                    'expectedResponseTime': np.random.uniform(0.0, 0.5),
                    'completedOrders': np.random.uniform(0.0, 0.4),
                    'cancellationRate': np.random.uniform(0.0, 0.3),
                    'cityMatch': np.random.choice([0.1, 1.0]),
                    'urgencyAlignment': np.random.uniform(0.0, 0.3)
                }
            elif trap_type == 1:
                # 2. Closed Trap (Perfect but WorkingHours = 0)
                breakdown = {
                    'distance': np.random.uniform(0.7, 1.0),
                    'rating': np.random.uniform(0.7, 1.0),
                    'serviceMatch': np.random.uniform(0.7, 1.0),
                    'workingHours': 0.1, # CLOSED
                    'emergencySupport': np.random.choice([0.0, 1.0]),
                    'expectedResponseTime': np.random.uniform(0.7, 1.0),
                    'completedOrders': np.random.uniform(0.7, 1.0),
                    'cancellationRate': np.random.uniform(0.7, 1.0),
                    'cityMatch': 1.0,
                    'urgencyAlignment': np.random.uniform(0.7, 1.0)
                }
            elif trap_type == 2:
                # 3. Cancellation Trap (Perfect but High Cancellation)
                breakdown = {
                    'distance': np.random.uniform(0.7, 1.0),
                    'rating': np.random.uniform(0.7, 1.0),
                    'serviceMatch': np.random.uniform(0.7, 1.0),
                    'workingHours': np.random.uniform(0.7, 1.0),
                    'emergencySupport': np.random.choice([0.0, 1.0]),
                    'expectedResponseTime': np.random.uniform(0.7, 1.0),
                    'completedOrders': np.random.uniform(0.7, 1.0),
                    'cancellationRate': 0.0, # 100% CANCELLATION
                    'cityMatch': 1.0,
                    'urgencyAlignment': np.random.uniform(0.7, 1.0)
                }
            elif trap_type == 3:
                # 4. Far Distance Trap
                breakdown = {
                    'distance': 0.05, # VERY FAR
                    'rating': np.random.uniform(0.7, 1.0),
                    'serviceMatch': np.random.uniform(0.7, 1.0),
                    'workingHours': np.random.uniform(0.7, 1.0),
                    'emergencySupport': np.random.choice([0.0, 1.0]),
                    'expectedResponseTime': 0.2, # Slow because far
                    'completedOrders': np.random.uniform(0.7, 1.0),
                    'cancellationRate': np.random.uniform(0.7, 1.0),
                    'cityMatch': np.random.choice([0.1, 1.0]),
                    'urgencyAlignment': np.random.uniform(0.7, 1.0)
                }
            elif trap_type == 4:
                # 5. Emergency Mismatch
                breakdown = {
                    'distance': np.random.uniform(0.7, 1.0),
                    'rating': np.random.uniform(0.7, 1.0),
                    'serviceMatch': np.random.uniform(0.7, 1.0),
                    'workingHours': np.random.uniform(0.7, 1.0),
                    'emergencySupport': 0.0, # NO EMERGENCY
                    'expectedResponseTime': np.random.uniform(0.7, 1.0),
                    'completedOrders': np.random.uniform(0.7, 1.0),
                    'cancellationRate': np.random.uniform(0.7, 1.0),
                    'cityMatch': 1.0,
                    'urgencyAlignment': 0.1  # MISMATCH
                }

        log["recommendations"] = [
            {
                "provider": fake_provider_id,
                "score": 50,
                "distanceKm": 5.0,
                "confidence": 0.9,
                "scoresBreakdown": breakdown,
                "reasons": []
            }
        ]
        synthetic_logs.append(log)
        
    # Insert to DB
    collection.insert_many(synthetic_logs)
    print(f"Successfully inserted {len(synthetic_logs)} nuanced synthetic logs into Atlas.")

if __name__ == '__main__':
    main()
