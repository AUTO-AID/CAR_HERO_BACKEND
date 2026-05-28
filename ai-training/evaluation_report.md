# تقرير تقييم أداء نموذج التوصية الذكي (ML Evaluation Report)

تم توليد هذا التقرير تلقائياً بعد إنهاء دورة التدريب التجريبية للنموذج.

## 1. مقاييس الأداء العامة (Global Metrics)

| المقياس (Metric) | القيمة (Value) |
| :--- | :--- |
| **الدقة (Accuracy)** | `69.35%` |
| **الدقة العالية (Precision)** | `69.49%` |
| **الاستدعاء (Recall)** | `34.92%` |

## 2. مصفوفة الارتباك (Confusion Matrix)

تبين مدى قدرة النموذج على توقع الرفض والقبول:

- **True Negatives (توقع صحيح بالرفض):** `1141`
- **False Positives (توقع خاطئ بالقبول):** `119`
- **False Negatives (توقع خاطئ بالرفض):** `505`
- **True Positives (توقع صحيح بالقبول):** `271`

## 3. الأهمية النسبية للميزات (Feature Importances)

ترتيب الميزات التي اعتمد عليها النموذج للتنبؤ بقرار العميل وقبول التوصية:

| الترتيب | الميزة (Feature) | الأهمية النسبية (Weight) |
| :--- | :--- | :--- |
| 1 | `distance` | `37.78%` |
| 2 | `rating` | `16.71%` |
| 3 | `expectedResponseTime` | `13.97%` |
| 4 | `cancellationRate` | `9.71%` |
| 5 | `completedOrders` | `9.67%` |
| 6 | `serviceMatch` | `3.91%` |
| 7 | `urgencyAlignment` | `3.35%` |
| 8 | `workingHours` | `2.57%` |
| 9 | `emergencySupport` | `2.34%` |
| 10 | `cityMatch` | `0.00%` |

## 4. تقرير التصنيف التفصيلي (Classification Report)

```
              precision    recall  f1-score   support

           0       0.69      0.91      0.79      1260
           1       0.69      0.35      0.46       776

    accuracy                           0.69      2036
   macro avg       0.69      0.63      0.63      2036
weighted avg       0.69      0.69      0.66      2036
```
