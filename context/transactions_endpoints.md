# مرجع واجهات برمجة التطبيقات للعمليات المالية (Transactions API Reference) - CarHero

يحتوي هذا المستند على التوثيق الفني الشامل لكافة نقاط الاتصال (Endpoints) الخاصة بموديول العمليات المالية والمحفظة، مع تفصيل كامل لهياكل البيانات وصلاحيات الوصول.

- **الرابط الأساسي (Base URL)**: `/api/v1`
- **نظام الحماية**: يتطلب `JWT Token` مع التحقق من الصلاحيات (Roles).

---

## 1. عمليات المزود (Provider Operations)
**المسار**: `/v1/provider/wallet`

### أ. طلب سحب أرباح (Request Payout)
- **المسار**: `POST /v1/provider/wallet/payout`
- **الوصف**: يسمح للمزود بتقديم طلب سحب لمبلغ معين من رصيده المتاح.
- **هيكل البيانات (Request Body - WithdrawDto)**:
```json
{
  "amount": 500,
  "bankAccount": "SA123456789...",
  "bankName": "Al Rajhi Bank"
}
```

### ب. تاريخ العمليات الخاص بالمزود
- **المسار**: `GET /v1/provider/wallet/transactions`
- **البارامترات (Query Params)**:
  - `page`: رقم الصفحة (افتراضي: 1)
  - `limit`: عدد النتائج (افتراضي: 10)

---

## 2. عمليات الإدارة (Admin Operations)
**المسار**: `/v1/admin/wallet`

### أ. الملخص المالي العام (Financial Stats)
- **المسار**: `GET /v1/admin/wallet/stats`
- **الوصف**: يعرض إحصائيات مالية شاملة عن أداء المنصة.
- **مثال الاستجابة**:
```json
{
  "success": true,
  "data": {
    "platformBalance": 1500.50,
    "totalCommissionEarned": 1500.50,
    "totalPayoutsProcessed": 5000.00,
    "currency": "SAR"
  }
}
```

### ب. السجل العالمي للعمليات (Global Audit Log)
- **المسار**: `GET /v1/admin/wallet/transactions/all`
- **الوصف**: البحث في كافة عمليات النظام مع فلاتر متقدمة.
- **البارامترات (Query Params)**:
  - `type`: نوع العملية (credit / debit)
  - `status`: حالة العملية (pending / completed / failed)
  - `ownerType`: نوع المالك (user / provider / system)
  - `startDate` / `endDate`: نطاق تاريخي (YYYY-MM-DD)

### ج. معالجة طلبات السحب (Handle Payout)
- **المسار**: `PATCH /v1/admin/wallet/payouts/:id`
- **الوصف**: الموافقة على التحويل البنكي أو رفضه.
- **هيكل البيانات (Request Body)**:
```json
{
  "action": "complete", // أو "reject" لإعادة المبلغ لمحفظة المزود
  "note": "تم التحويل بنجاح برقم مرجع: 998877"
}
```

---

## 3. قواعد العمل والأمان (Business Rules & Security)

### أ. الذرية المالية (Financial Atomicity)
- جميع العمليات التي تتضمن أكثر من محفظة (مثل تقسيم أرباح الطلب) تتم في سياق **Database Transaction**. في حالة فشل أي جزء، يتم التراجع عن كامل العملية لضمان سلامة الأرصدة.

### ب. الحماية من الازدواج (Double-Transfer Prevention)
- يطبق النظام "فحصاً ذكياً" قبل تحويل الأرباح للمزود؛ إذا وجد النظام عملية `credit` مسجلة مسبقاً لنفس الطلب، يتم إيقاف العملية فوراً لمنع الدفع المكرر.

### ج. نظام رد الأموال (Automated Refunds)
- عند إلغاء أي طلب حالته `PAID` (مدفوع)، يقوم النظام تلقائياً بإنشاء عملية `REFUND` وإعادة المبلغ لمحفظة العميل مع تحديث حالة الدفع في الطلب إلى `REFUNDED`.

---

## 4. أمثلة العمليات (Transaction Examples)

### سجل عملية تحويل أرباح (Earning Transfer)
```json
{
  "transactionNumber": "TXN-171269...",
  "ownerType": "provider",
  "type": "credit",
  "amount": 180.00,
  "balanceBefore": 1000.00,
  "balanceAfter": 1180.00,
  "description": "Earnings from order #CH-1234 (10% commission deducted: 20 SAR)",
  "status": "completed"
}
```

---

> [!IMPORTANT]
> العملة الرسمية المعتمدة في كافة العمليات هي **ريال سعودي (SAR)**.
