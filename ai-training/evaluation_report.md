# تقرير تقييم أداء نموذج التوصية الذكي (ML Evaluation Report)

تم توليد هذا التقرير تلقائياً بعد إنهاء دورة التدريب التجريبية للنموذج.

## 1. مقاييس الأداء العامة (Global Metrics)

| المقياس (Metric) | القيمة (Value) |
| :--- | :--- |
| **الدقة (Accuracy)** | `99.80%` |
| **الدقة العالية (Precision)** | `100.00%` |
| **الاستدعاء (Recall)** | `99.50%` |

## 2. مصفوفة الارتباك (Confusion Matrix)

تبين مدى قدرة النموذج على توقع الرفض والقبول:

- **True Negatives (توقع صحيح بالرفض):** `300`
- **False Positives (توقع خاطئ بالقبول):** `0`
- **False Negatives (توقع خاطئ بالرفض):** `1`
- **True Positives (توقع صحيح بالقبول):** `199`

## 3. الأهمية النسبية للميزات (Feature Importances)

ترتيب الميزات التي اعتمد عليها النموذج للتنبؤ بقرار العميل وقبول التوصية:

| الترتيب | الميزة (Feature) | الأهمية النسبية (Weight) |
| :--- | :--- | :--- |
| 1 | `cancellationRate` | `30.23%` |
| 2 | `workingHours` | `27.85%` |
| 3 | `urgencyAlignment` | `12.20%` |
| 4 | `emergencySupport` | `8.96%` |
| 5 | `distance` | `8.75%` |
| 6 | `expectedResponseTime` | `7.07%` |
| 7 | `cityMatch` | `2.47%` |
| 8 | `completedOrders` | `1.81%` |
| 9 | `serviceMatch` | `0.39%` |
| 10 | `rating` | `0.28%` |

## 4. تقرير التصنيف التفصيلي (Classification Report)

```
              precision    recall  f1-score   support

           0       1.00      1.00      1.00       300
           1       1.00      0.99      1.00       200

    accuracy                           1.00       500
   macro avg       1.00      1.00      1.00       500
weighted avg       1.00      1.00      1.00       500
```
