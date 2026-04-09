# مرجع واجهات برمجة التطبيقات للتقييمات (Reviews API Reference) - CarHero

يحتوي هذا المستند على التوثيق الفني الشامل لكافة نقاط الاتصال (Endpoints) الخاصة بموديول التقييمات والمراجعات، مع تفصيل كامل لهياكل البيانات وصلاحيات الوصول.

- **الرابط الأساسي (Base URL)**: `/api/v1/reviews`
- **نظام الحماية**: العمليات الحساسة تتطلب `JWT Token`.

---

## 1. العمليات العامة (Public Operations)
هذه العمليات متاحة للجميع ولا تتطلب تسجيل دخول.

### أ. جلب مراجعات مزود معين
- **المسار**: `GET /reviews/provider/:providerId`
- **الوصف**: جلب جميع المراجعات العامة لمزود خدمة معين مع دعم التصفح (Pagination).
- **البارامترات (Query Params)**:
  - `page`: رقم الصفحة (افتراضي: 1)
  - `limit`: عدد النتائج في الصفحة (افتراضي: 10)

---

## 2. عمليات المستخدم (Authenticated Operations)
تتطلب هذه العمليات إرسال `Authorization: Bearer <JWT_TOKEN>`.

### أ. إنشاء تقييم جديد
- **المسار**: `POST /reviews`
- **الوصف**: إضافة تقييم ومراجعة لطلب (Order) أو حجز (Booking) بعد اكتماله.
- **هيكل البيانات (Request Body - CreateReviewDto)**:
```json
{
  "orderId": "string (اختياري - ID الطلب)",
  "bookingId": "string (اختياري - ID الحجز)",
  "rating": "number (1-5 - التقييم العام)",
  "comment": "string (اختياري - التعليق النصي)",
  "serviceQuality": "number (1-5 - جودة الخدمة)",
  "punctuality": "number (1-5 - الانضباط بالمواعيد)",
  "professionalism": "number (1-5 - الاحترافية)",
  "valueForMoney": "number (1-5 - القيمة مقابل السعر)",
  "images": "string[] (اختياري - روابط صور)"
}
```

### ب. الرد على تقييم (للمزودين)
- **المسار**: `PATCH /reviews/:id/respond`
- **الوصف**: يسمح لمزود الخدمة بالرد على تقييم العميل.
- **هيكل البيانات (Request Body)**:
```json
{
  "response": "string (نص الرد)"
}
```

### ج. حذف تقييم
- **المسار**: `DELETE /reviews/:id`
- **الوصف**: حذف مراجعة معينة.
- **الصلاحيات**: صاحب التقييم حصراً أو الأدمن (Admin).

---

## 3. قواعد العمل والأمان (Business Rules & Security)

### أ. التحقق من الصلاحيات (Security)
- **ملكية الطلب**: لا يمكن تقييم طلب إلا من قبل المستخدم الذي أنشأ الطلب (UserId Check).
- **حالة الطلب**: لا يمكن إضافة تقييم إلا إذا كانت حالة الطلب/الحجز `COMPLETED`.
- **المنع من التلاعب**: لا يمكن للمستخدم تقييم نفس الطلب أكثر من مرّة.

### ب. تأثيرات التقييم (Side Effects)
- **تحديث السمعة**: يتم إعادة حساب `averageRating` و `totalReviews` في موديول المزودين (Providers) فورياً عند:
  - إضافة تقييم جديد.
  - حذف تقييم موجود.

---

## 4. أمثلة الاستجابة (Response Examples)

### استجابة نجاح (201 Created)
```json
{
  "_id": "67a3f...",
  "userId": "user_id_123",
  "providerId": "provider_id_456",
  "orderId": "order_id_789",
  "rating": 5,
  "comment": "خدمة ممتازة وسريعة جدداً",
  "createdAt": "2026-04-10T10:00:00Z"
}
```

### استجابة خطأ (403 Forbidden)
```json
{
  "statusCode": 403,
  "message": "You do not have permission to review this order",
  "error": "Forbidden"
}
```

---

> [!TIP]
> جميع الواجهات البرمجية تدعم الـ Swagger UI. يمكنك الوصول إليها عبر المسار الرئيسي للمشروع `/api/docs` للحصول على تجربة تفاعلية.
