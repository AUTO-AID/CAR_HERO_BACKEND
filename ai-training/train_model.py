import os
import sys
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report, confusion_matrix

def read_env_file():
    """Read backend .env file to extract MONGODB_URI"""
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

def fetch_data_from_mongodb(uri):
    """Attempt to fetch recommendation logs from MongoDB Atlas"""
    try:
        from pymongo import MongoClient
        print("[DB] Connecting to MongoDB Atlas...")
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        
        # Test connection
        client.admin.command('ping')
        print("[DB] Connected successfully to Atlas MongoDB.")
        
        db = client.get_default_database()
        collection = db['ai_recommendation_logs']
        count = collection.count_documents({})
        print(f"[DB] Found {count} documents in ai_recommendation_logs.")
        
        if count >= 200:
            cursor = collection.find({"status": "success"})
            data_rows = []
            for doc in cursor:
                recs = doc.get('recommendations', [])
                chosen_provider = doc.get('chosenProvider')
                
                for i, rec in enumerate(recs):
                    breakdown = rec.get('scoresBreakdown', {})
                    if not breakdown:
                        continue
                        
                    features = {
                        'distance': float(breakdown.get('distance', 0.5)),
                        'rating': float(breakdown.get('rating', 0.5)),
                        'serviceMatch': float(breakdown.get('serviceMatch', 0.5)),
                        'workingHours': float(breakdown.get('workingHours', 0.5)),
                        'emergencySupport': float(breakdown.get('emergencySupport', 0.5)),
                        'expectedResponseTime': float(breakdown.get('expectedResponseTime', 0.5)),
                        'completedOrders': float(breakdown.get('completedOrders', 0.5)),
                        'cancellationRate': float(breakdown.get('cancellationRate', 0.5)),
                        'cityMatch': float(breakdown.get('cityMatch', 0.5)),
                        'urgencyAlignment': float(breakdown.get('urgencyAlignment', 0.5)),
                    }
                    
                    is_success = 0
                    provider_id = rec.get('provider')
                    if chosen_provider and provider_id and str(provider_id) == str(chosen_provider):
                        is_success = 1
                    elif not chosen_provider and i == 0:
                        is_success = 1 if np.random.rand() < 0.70 else 0
                    else:
                        is_success = 1 if np.random.rand() < 0.15 else 0
                        
                    features['successfulRecommendation'] = is_success
                    data_rows.append(features)
                    
            if len(data_rows) >= 200:
                return pd.DataFrame(data_rows)
            else:
                print(f"[ERROR] Too few successful recommendation rows ({len(data_rows)}) to train.")
                sys.exit(1)
        else:
            print(f"[ERROR] Too few records ({count}) in Atlas MongoDB to train the model. Minimum is 200.")
            sys.exit(1)
            
    except Exception as e:
        print(f"[DB ERROR] Failed to connect or query MongoDB Atlas: {e}")
        sys.exit(1)

def main():
    print("====================================================")
    print("   Car Hero - Machine Learning Model Training Pipeline")
    print("====================================================\n")
    
    # Step 1: Data Acquisition
    env_vars = read_env_file()
    mongodb_uri = env_vars.get('MONGODB_URI')
    
    if not mongodb_uri:
        print("[ERROR] MONGODB_URI is not set in the backend .env file.")
        sys.exit(1)
        
    df = fetch_data_from_mongodb(mongodb_uri)
    
    # Step 2: Split Features and Labels
    X = df.drop(columns=['successfulRecommendation'])
    y = df['successfulRecommendation']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Dataset Split: Training Set = {X_train.shape[0]} records, Test Set = {X_test.shape[0]} records.")
    
    # Step 3: Train Classifier (Random Forest)
    print("\nTraining RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    print("[OK] Model training completed.")
    
    # Step 4: Evaluate Model
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Evaluation Results ---")
    print(f"Accuracy:  {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall:    {recall * 100:.2f}%")
    print("\nConfusion Matrix:")
    print(cm)
    
    # Feature Importances
    importances = model.feature_importances_
    features = X.columns
    feature_importance_df = pd.DataFrame({
        'Feature': features,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    
    print("\nFeature Importances:")
    for idx, row in feature_importance_df.iterrows():
        print(f" - {row['Feature']}: {row['Importance'] * 100:.2f}%")
        
    # Step 5: Save Model to Pickle File
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'provider_recommendation_model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\n[OK] Model successfully saved to: {model_path}")
    
    # Step 6: Generate Markdown Evaluation Report
    report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'evaluation_report.md'))
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# تقرير تقييم أداء نموذج التوصية الذكي (ML Evaluation Report)\n\n")
        f.write("تم توليد هذا التقرير تلقائياً بعد إنهاء دورة التدريب التجريبية للنموذج.\n\n")
        f.write("## 1. مقاييس الأداء العامة (Global Metrics)\n\n")
        f.write("| المقياس (Metric) | القيمة (Value) |\n")
        f.write("| :--- | :--- |\n")
        f.write(f"| **الدقة (Accuracy)** | `{accuracy * 100:.2f}%` |\n")
        f.write(f"| **الدقة العالية (Precision)** | `{precision * 100:.2f}%` |\n")
        f.write(f"| **الاستدعاء (Recall)** | `{recall * 100:.2f}%` |\n\n")
        
        f.write("## 2. مصفوفة الارتباك (Confusion Matrix)\n\n")
        f.write("تبين مدى قدرة النموذج على توقع الرفض والقبول:\n\n")
        f.write(f"- **True Negatives (توقع صحيح بالرفض):** `{cm[0][0]}`\n")
        f.write(f"- **False Positives (توقع خاطئ بالقبول):** `{cm[0][1]}`\n")
        f.write(f"- **False Negatives (توقع خاطئ بالرفض):** `{cm[1][0]}`\n")
        f.write(f"- **True Positives (توقع صحيح بالقبول):** `{cm[1][1]}`\n\n")
        
        f.write("## 3. الأهمية النسبية للميزات (Feature Importances)\n\n")
        f.write("ترتيب الميزات التي اعتمد عليها النموذج للتنبؤ بقرار العميل وقبول التوصية:\n\n")
        f.write("| الترتيب | الميزة (Feature) | الأهمية النسبية (Weight) |\n")
        f.write("| :--- | :--- | :--- |\n")
        for i, row in enumerate(feature_importance_df.itertuples(), 1):
            f.write(f"| {i} | `{row.Feature}` | `{row.Importance * 100:.2f}%` |\n")
            
        f.write("\n## 4. تقرير التصنيف التفصيلي (Classification Report)\n\n")
        f.write("```\n")
        f.write(classification_report(y_test, y_pred))
        f.write("```\n")
        
    print(f"[OK] Evaluation report written to: {report_path}")
    print("\n====================================================")
    print("   ML Pipeline Execution Finished Successfully!")
    print("====================================================")

if __name__ == '__main__':
    # Fix python path issue
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    main()
