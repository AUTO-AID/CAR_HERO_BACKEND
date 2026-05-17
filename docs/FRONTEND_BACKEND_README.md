# CarHero Backend Guide For Frontend

هذا الملف موجه لفريق الـ frontend حتى يفهم بنية الباك إند، الجداول، العلاقات، نقاط الوصول، الفلوهات الأساسية، الحالات، الملاحظات المهمة، وكيفية ربط الواجهات بشكل صحيح.

> آخر تحديث: بعد توحيد `orders/bookings`، توحيد الرصيد داخل `wallets`، وإضافة `audit_logs` و `status_histories`.

---

## 1. الفكرة العامة للنظام

CarHero منصة خدمات سيارات فيها ثلاثة أنواع واجهات رئيسية:

| الواجهة | المستخدم | الهدف |
|---|---|---|
| تطبيق العميل | user/customer | تسجيل، إدارة السيارات، طلب خدمة فورية، حجز موعد، محفظة، اشتراك، تقييم، إشعارات، شات |
| لوحة المزود | provider | إدارة الملف، الخدمات، ساعات العمل، الطلبات، المحفظة، السحب، الشات |
| لوحة الأدمن | admin | إدارة العملاء، المزودين، الخدمات، الطلبات، الاشتراكات، المحفظة، الإعدادات، سجل النشاطات |

النظام مبني على MongoDB/Mongoose. أغلب الجداول هي collections.

---

## 2. Base URL و Auth

الـ API الأساسي:

```txt
http://localhost:3001/api/v1
```

في الإنتاج يجب أن يأتي من env:

```txt
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
```

كل endpoint محمي يحتاج:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

التوكنات:

| Token | الاستخدام |
---|---|
| accessToken | يرسل مع كل request محمي |
| refreshToken | يستخدم لتجديد accessToken |

في `car-hero-admin` يتم تخزين:

```txt
admin_access_token
admin_refresh_token
admin_data
```

---

## 3. الأدوار والصلاحيات

الأدوار الأساسية:

| role | المعنى | أين يستخدم |
---|---|---|
| user | عميل عادي | تطبيق العميل |
| provider | مزود خدمة | لوحة المزود |
| admin | مسؤول | لوحة الأدمن |
| super_admin | مسؤول أعلى | صلاحيات إدارية أوسع، حسب التطبيق |

الفرق بين `accountType` و `role`:

| الحقل | وظيفته |
---|---|
| accountType | نوع الحساب من ناحية business: customer/provider/admin |
| role | صلاحية الوصول داخل النظام: user/provider/admin |

مثال:

```json
{
  "accountType": "customer",
  "role": "user"
}
```

هذا يعني أن الحساب عميل في النظام، وصلاحيته مستخدم عادي.

---

## 4. قاعدة مهمة جدا: الفرق بين Orders و Bookings

لا يوجد collection مستقل باسم `bookings`.

الحجز المجدول هو `order` داخل جدول `orders` لكن:

```json
{
  "isScheduled": true,
  "scheduledAt": "2026-05-20T10:00:00.000Z"
}
```

الطلب الفوري:

```json
{
  "isScheduled": false
}
```

لذلك:

| API | التخزين |
---|---|
| `POST /orders` | ينشئ طلب فوري داخل `orders` |
| `POST /bookings` | ينشئ حجز مجدول داخل `orders` |
| `GET /bookings` | يرجع فقط orders التي فيها `isScheduled=true` |
| `GET /orders` | يرجع الطلبات، ويمكن أن تشمل المجدولة حسب الفلتر |

مهم للفرونت:

- لا تبحث عن جدول `bookingdocuments`.
- تفاصيل الحجز المجدول تأتي من نفس شكل order.
- صفحة الحجوزات في الأدمن أو المزود يجب أن تعتمد على `/bookings`.

---

## 5. الجداول الفعلية ووظيفة كل جدول

| Collection | Model | الوظيفة |
---|---|---|
| `users` | User | حسابات العملاء، بيانات الدخول، التحقق، التفضيلات، السيارات، الاشتراك الحالي. لا يخزن الرصيد المالي. |
| `admins` | Admin | حسابات مسؤولي لوحة التحكم، الصلاحيات، حالة الحساب، توكن الجلسة. |
| `audit_logs` | AuditLog | سجل أمني لعمليات الأدمن الحساسة: حذف، تعديل، قبول مزود، تغيير إعدادات، تعديل صلاحيات. |
| `providers` | Provider | مزودو الخدمة: ورش وفنيين، الموقع، حالة الاعتماد، الخدمات، ساعات العمل، التقييمات. |
| `services` | Service | كتالوج الخدمات العامة أو الخاصة بمزود، السعر، المدة، التصنيف، الخيارات. |
| `vehicles` | Vehicle | سيارات المستخدمين المرتبطة بالطلبات والصيانة والتذكيرات. |
| `maintenancerecords` | MaintenanceRecord | سجل صيانة سيارة: نوع صيانة، تكلفة، عداد، مرفقات. |
| `vehiclereminders` | VehicleReminder | تذكيرات السيارة حسب التاريخ أو العداد. |
| `orders` | Order | الجدول الموحد للطلبات الفورية والحجوزات المجدولة. |
| `status_histories` | StatusHistory | سجل انتقالات حالة الطلب/الحجز: من pending إلى accepted... ومن غيّرها ومتى. |
| `wallets` | Wallet | المصدر الوحيد للرصيد، الرصيد المعلق، نقاط الولاء، العملة. |
| `transactions` | Transaction | سجل كل حركة مالية على المحفظة: دفع، إيداع، استرداد، مكافأة، سحب. |
| `subscription_plans` | SubscriptionPlan | خطط الاشتراك المتاحة للبيع. |
| `user_subscriptions` | UserSubscription | اشتراكات المستخدمين الفعلية وتواريخها وحالتها. |
| `chats` | Chat | غرفة محادثة مرتبطة بطلب. |
| `messages` | Message | الرسائل الفردية داخل المحادثة. |
| `notifications` | Notification | إشعارات داخل التطبيق للمستخدم أو المزود أو الأدمن. |
| `reviews` | Review | تقييمات المستخدمين للمزودين والطلبات. |
| `settings` | Setting | إعدادات عامة مثل وضع الصيانة والرسائل العامة. |
| `pending_registrations` | PendingRegistration | تسجيل مؤقت قبل OTP، ينتهي تلقائيا. |
| `logouts` | Logout | سجل خروج وتعطيل refresh tokens. |

---

## 6. العلاقات الأساسية

| العلاقة | الشرح |
---|---|
| user -> vehicles | المستخدم يملك عدة سيارات. |
| user -> orders | المستخدم ينشئ طلبات وحجوزات. |
| provider -> orders | المزود ينفذ أو يستلم طلبات. |
| service -> orders | كل طلب مرتبط بخدمة واحدة. |
| vehicle -> orders | الطلب قد يرتبط بسيارة. |
| order -> status_histories | كل تغيير حالة يضاف كسطر زمني. |
| order -> chat | الطلب قد يملك محادثة. |
| chat -> messages | المحادثة تحتوي رسائل. |
| user/provider -> wallets | المحفظة متعددة الأنواع حسب `ownerType`. |
| wallet -> transactions | كل حركة مالية مرتبطة بمحفظة. |
| subscription_plan -> user_subscriptions | اشتراك المستخدم يشير إلى الخطة المشتراة. |
| user -> user_subscriptions | المستخدم لديه سجل اشتراكات. |
| provider -> reviews | المزود يستقبل تقييمات. |
| order -> reviews | الطلب يمكن أن يكون له تقييم واحد. |
| admin -> audit_logs | كل عملية أدمن حساسة تسجل في audit logs. |
| user/provider/admin -> notifications | الإشعارات تستخدم recipientId + recipientType. |

---

## 7. الحالات والـ enums المهمة

### OrderStatus

```txt
pending
accepted
provider_assigned
provider_en_route
provider_arrived
in_progress
completed
cancelled
rejected
```

اقتراح واجهة العرض:

| status | عرض عربي |
---|---|
| pending | بانتظار القبول |
| accepted | مقبول |
| provider_assigned | تم تعيين مزود |
| provider_en_route | المزود بالطريق |
| provider_arrived | وصل المزود |
| in_progress | قيد التنفيذ |
| completed | مكتمل |
| cancelled | ملغى |
| rejected | مرفوض |

### PaymentStatus

```txt
pending
completed
failed
refunded
```

### PaymentMethod

```txt
cash
wallet
card
points
```

### ProviderStatus

```txt
online
offline
busy
```

### RegistrationStatus

```txt
pending
approved
rejected
```

### NotificationType

```txt
order_created
order_updated
order_cancelled
new_message
reminder
system_alert
info
alert
```

### ServiceCategory

```txt
roadside_assistance
towing
battery
tire
fuel
lockout
maintenance
car_wash
other
```

---

## 8. Auth Flow

### تسجيل مستخدم

```http
POST /auth/register
```

ينشئ غالبا pending registration بانتظار OTP.

### تأكيد OTP

```http
POST /auth/verify-otp
```

بعد التأكيد يتحول الحساب إلى user فعلي.

### تسجيل الدخول

```http
POST /auth/login
```

يرجع accessToken و refreshToken وبيانات الحساب.

### تجديد التوكن

```http
POST /auth/refresh-token
```

### تسجيل خروج

```http
POST /auth/logout
```

يسجل logout record ويعطل refresh token حسب التطبيق.

### Admin Login

```http
POST /admin/login
```

خاص بلوحة الأدمن.

---

## 9. Orders / Bookings Flow

### إنشاء طلب فوري

```http
POST /orders
```

Body نموذجي:

```json
{
  "serviceId": "SERVICE_ID",
  "providerId": "PROVIDER_ID",
  "vehicleId": "VEHICLE_ID",
  "location": {
    "coordinates": [36.2765, 33.5138]
  },
  "notes": "ملاحظات العميل"
}
```

ينتج:

- document داخل `orders`
- `status = pending`
- `isScheduled = false`
- سطر داخل `status_histories`
- إشعار للمزود إذا كان معيناً

### إنشاء حجز مجدول

```http
POST /bookings
```

Body:

```json
{
  "serviceId": "SERVICE_ID",
  "providerId": "PROVIDER_ID",
  "vehicleId": "VEHICLE_ID",
  "scheduleTime": "2026-05-20T10:00:00.000Z",
  "location": {
    "coordinates": [36.2765, 33.5138]
  },
  "notes": "حجز غسيل سيارة"
}
```

شرط مهم:

```txt
scheduleTime مطلوب في /bookings
```

ينتج order فيه:

```json
{
  "isScheduled": true,
  "scheduledAt": "2026-05-20T10:00:00.000Z"
}
```

### عرض الطلبات

```http
GET /orders?page=1&limit=10&status=pending
```

حسب الدور:

- admin يرى الكل.
- provider يرى طلباته.
- user يرى طلباته.

### عرض الحجوزات

```http
GET /bookings?page=1&limit=10&status=pending
```

يرجع فقط `orders` التي فيها `isScheduled=true`.

### تغيير حالة الطلب

```http
PATCH /orders/:id/status
```

Body:

```json
{
  "status": "in_progress"
}
```

ينتج:

- تحديث `orders.status`
- إذا `completed`: يتم تحويل أرباح للمزود إذا وجدت
- كتابة سجل في `status_histories`
- إرسال event للإشعارات/الأتمتة

### إلغاء الطلب

```http
POST /orders/:id/cancel
```

Body:

```json
{
  "reason": "العميل غير متاح",
  "cancelledBy": "user"
}
```

شروط:

- لا يمكن إلغاء `completed`
- لا يمكن إلغاء `cancelled`
- لا يمكن إلغاء `in_progress` حسب المنطق الحالي
- إذا كان مدفوعاً يتم refund للمحفظة
- يتم تسجيل انتقال الحالة في `status_histories`

### سجل حالات الطلب

```http
GET /orders/:orderId/status-history
```

يستخدم في صفحة تفاصيل الطلب كـ timeline.

مثال عرض:

```txt
pending -> accepted -> in_progress -> completed
```

---

## 10. Wallet / Finance Flow

القاعدة الذهبية:

```txt
wallets هو المصدر الوحيد للرصيد والنقاط.
```

لا تعتمد على:

- `user.walletBalance`
- `user.pointsBalance`
- `provider.walletBalance`

هذه الحقول غير معتمدة بعد التحديث.

### محفظة المستخدم

```http
GET /v1/wallet/me
GET /v1/wallet/transactions
POST /v1/wallet/deposit
```

> ملاحظة: بسبب إعداد controller الحالي قد تظهر في التوثيق كـ `/api/v1/v1/wallet/...`.

### محفظة المزود

```http
GET /v1/provider/wallet/me
GET /v1/provider/wallet/transactions
POST /v1/provider/wallet/withdraw
POST /v1/provider/wallet/payout
```

### محفظة الأدمن

```http
GET /v1/admin/wallet/stats
GET /v1/admin/wallet/transactions/all
PATCH /v1/admin/wallet/payouts/:id
POST /v1/admin/wallet/:ownerId/adjust
```

كل عملية مالية مهمة يجب أن تظهر في:

- `transactions`
- وربما `audit_logs` إذا كانت عملية أدمن حساسة

---

## 11. Subscriptions Flow

يوجد جدولان فقط للاشتراكات:

| الجدول | الوظيفة |
---|---|
| `subscription_plans` | الخطط المتاحة للبيع |
| `user_subscriptions` | اشتراك مستخدم فعلي في خطة |

### عرض الخطط

```http
GET /subscriptions/plans
GET /subscriptions/plans/:id
```

### الاشتراك

```http
POST /subscriptions/subscribe
```

### تجديد/ترقية/إلغاء

```http
POST /subscriptions/renew
POST /subscriptions/upgrade
POST /subscriptions/cancel
```

### إدارة الخطط في الأدمن

هناك مساران موجودان حالياً:

```http
POST /admin/memberships
PATCH /admin/memberships/:id
DELETE /admin/memberships/:id
```

وأيضاً:

```http
POST /subscriptions/admin/plans
PATCH /subscriptions/admin/plans/:id
DELETE /subscriptions/admin/plans/:id
```

ملاحظة مهمة:

```txt
يوجد تكرار في admin APIs للاشتراكات. الأفضل frontend يختار مساراً واحداً ويثبت عليه.
```

حالياً `car-hero-admin` يستخدم غالباً `/admin/memberships`.

---

## 12. Providers Flow

### تقديم طلب مزود

```http
POST /providers/apply
```

ينشئ provider بحالة:

```json
{
  "registrationStatus": "pending",
  "isApproved": false,
  "isActive": false
}
```

### قبول مزود

```http
PATCH /admin/providers/:id/approve
```

أو:

```http
POST /providers/:id/approve
```

يفضل في لوحة الأدمن استخدام `/admin/providers/:id/approve`.

### رفض مزود

```http
PATCH /admin/providers/:id/reject
```

Body:

```json
{
  "reason": "الوثائق غير واضحة"
}
```

ينتج `audit_logs`.

### إدارة مزود من لوحة المزود

```http
GET /providers/me
PUT /providers/me
PUT /providers/me/location
PUT /providers/me/status
PUT /providers/me/services
PUT /providers/me/working-hours
PUT /providers/me/documents
PUT /providers/me/bank-account
```

---

## 13. Services Flow

### عرض الخدمات العامة

```http
GET /services
GET /services/categories
GET /services/emergency
GET /services/search?query=wash
GET /services/:id
```

### إدارة الخدمات من الأدمن

مساران موجودان:

```http
POST /admin/services
PATCH /admin/services/:id
DELETE /admin/services/:id
```

وأيضاً:

```http
POST /services/admin
PATCH /services/admin/:id
PATCH /services/admin/:id/status
DELETE /services/admin/:id
```

ملاحظة:

```txt
يوجد تكرار في admin APIs للخدمات. الأفضل توحيدها لاحقاً.
```

كل تعديل خدمة حساس يكتب في `audit_logs`.

---

## 14. Vehicles Flow

### سيارات المستخدم

```http
GET /vehicles/my
POST /vehicles
GET /vehicles/:id
PATCH /vehicles/:id
DELETE /vehicles/:id
PATCH /vehicles/:id/set-default
```

### صيانة السيارة

```http
POST /vehicles/:id/maintenance
GET /vehicles/:id/maintenance
PATCH /vehicles/maintenance/:id
DELETE /vehicles/maintenance/:id
```

### تذكيرات السيارة

```http
POST /vehicles/:id/reminders
GET /vehicles/:id/reminders
DELETE /vehicles/reminders/:id
```

### إدارة سيارات من الأدمن

```http
GET /admin/vehicles
GET /admin/vehicles/:id
DELETE /admin/vehicles/:id
GET /admin/vehicles/stats
GET /admin/vehicles/top-models
GET /admin/vehicles/distribution
GET /admin/vehicles/year-stats
```

حذف سيارة من الأدمن يكتب في `audit_logs`.

---

## 15. Reviews Flow

التقييم يدعم:

- نجوم من 1 إلى 5
- تعليق نصي
- تقييمات تفصيلية اختيارية
- صور اختيارية
- رد المزود
- بلاغ/إخفاء حسب الحقول

### إنشاء تقييم

```http
POST /reviews
```

أو من تفاصيل الطلب:

```http
POST /orders/:id/review
```

### تقييمات مزود

```http
GET /reviews/provider/:providerId
```

### رد المزود

```http
PATCH /reviews/:id/respond
```

---

## 16. Chat Flow

المحادثة مرتبطة بطلب.

```http
GET /v1/chat/conversations
POST /v1/chat/conversations
GET /v1/chat/:chatId/messages
POST /v1/chat/upload
```

الجداول:

- `chats`: غرفة المحادثة وملخص آخر رسالة
- `messages`: الرسائل الفردية

مهم للفرونت:

- صفحة تفاصيل الطلب يمكن أن تحتوي زر "المحادثة".
- unreadCounts يمكن استخدامه لعداد الرسائل.

---

## 17. Notifications Flow

```http
GET /notifications
GET /notifications/unread-count
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

الإشعار يحتوي:

```json
{
  "recipientId": "ID",
  "recipientType": "user|provider|admin",
  "title": "...",
  "body": "...",
  "type": "order_created",
  "data": {},
  "isRead": false
}
```

---

## 18. Audit Logs في لوحة الأدمن

هذا خاص بـ `car-hero-admin` فقط.

لا تعرض `audit_logs` في provider dashboard أو تطبيق المستخدم.

### عرض سجل النشاطات

```http
GET /admin/audit-logs?page=1&limit=20
```

فلاتر:

```http
GET /admin/audit-logs?action=provider.approve
GET /admin/audit-logs?entityType=provider
GET /admin/audit-logs?entityId=ENTITY_ID
GET /admin/audit-logs?admin=ADMIN_ID
```

### سجل كيان محدد

```http
GET /admin/audit-logs/entity/provider/PROVIDER_ID
```

استخدامات frontend:

- صفحة مستقلة: سجل النشاطات.
- داخل تفاصيل مزود: تبويب "النشاطات".
- داخل تفاصيل خدمة: تبويب "آخر التعديلات".
- داخل الإعدادات: "آخر تغييرات النظام".

شكل السطر:

```json
{
  "adminEmail": "admin@carhero.com",
  "adminName": "Main Admin",
  "action": "provider.approve",
  "entityType": "provider",
  "entityId": "PROVIDER_ID",
  "after": {},
  "metadata": {},
  "createdAt": "2026-05-16T10:30:00.000Z"
}
```

---

## 19. Status Histories في الطلبات

هذا يستخدم في:

- `car-hero-admin`: تفاصيل الطلب أو الحجز.
- `car-hero-provider-dashboard`: تفاصيل الطلبات الخاصة بالمزود.
- تطبيق العميل: يمكن عرض timeline مبسط بدون معلومات إدارية حساسة.

Endpoint:

```http
GET /orders/:orderId/status-history
```

شكل السجل:

```json
{
  "entityType": "order",
  "entityId": "ORDER_ID",
  "orderNumber": "CH-...",
  "fromStatus": "pending",
  "toStatus": "accepted",
  "changedBy": "USER_OR_PROVIDER_OR_ADMIN_ID",
  "changedByRole": "provider",
  "reason": "optional",
  "metadata": {
    "isScheduled": true
  },
  "createdAt": "2026-05-16T10:30:00.000Z"
}
```

---

## 20. أهم نقاط الوصول مجمعة حسب الواجهة

### تطبيق العميل

```http
POST /auth/register
POST /auth/verify-otp
POST /auth/login
GET /auth/me
GET /users/me
PATCH /users/me
GET /vehicles/my
POST /vehicles
GET /services
GET /providers/nearby
POST /orders
POST /bookings
GET /orders
GET /bookings
GET /orders/:id
POST /orders/:id/cancel
POST /orders/:id/review
GET /v1/wallet/me
GET /v1/wallet/transactions
GET /subscriptions/plans
POST /subscriptions/subscribe
GET /notifications
PATCH /notifications/:id/read
```

### لوحة المزود

```http
GET /providers/me
PUT /providers/me
PUT /providers/me/location
PUT /providers/me/status
PUT /providers/me/services
PUT /providers/me/working-hours
GET /orders
GET /bookings
PATCH /orders/:id/status
POST /orders/:id/cancel
GET /orders/:orderId/status-history
GET /v1/provider/wallet/me
GET /v1/provider/wallet/transactions
POST /v1/provider/wallet/payout
GET /v1/chat/conversations
GET /v1/chat/:chatId/messages
```

### لوحة الأدمن

```http
POST /admin/login
GET /admin/me
GET /admin/stats
GET /admin/users
GET /admin/providers
PATCH /admin/providers/:id/approve
PATCH /admin/providers/:id/reject
GET /admin/services
POST /admin/services
GET /orders
GET /bookings
PATCH /orders/:id/status
GET /admin/memberships
GET /admin/vehicles
GET /v1/admin/wallet/stats
GET /admin/settings
PATCH /admin/settings/maintenance
GET /admin/audit-logs
GET /admin/status-histories
```

---

## 21. ملاحظات مهمة للفرونت

### 1. لا تعتمد على demo data

أي صفحة يجب أن تستخدم service functions من `src/lib/services.ts` أو API client.

### 2. لا تعتمد على أسماء عربية في المنطق

استخدم القيم الإنجليزية القادمة من الباك:

```txt
pending, accepted, completed
provider.approve
provider
```

ثم اعرض ترجمة عربية في UI.

### 3. ObjectId

أي `:id` هو Mongo ObjectId. لا ترسل نص عشوائي.

### 4. Pagination

معظم endpoints الإدارية ترجع:

```json
{
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

لكن بعض endpoints قد ترجع شكل مختلف. افحص response في الصفحة.

### 5. الحقول المالية

اعتمد فقط على:

```txt
wallets.balance
wallets.pendingBalance
wallets.loyaltyPoints
transactions
```

### 6. الحجوزات

الحجز ليس collection مستقل. هو order مجدول.

### 7. Audit logs

لا تظهر للعميل أو المزود. فقط للأدمن.

### 8. Status histories

يمكن عرضها للعميل والمزود لكن بشكل مبسط، دون كشف تفاصيل إدارية حساسة.

### 9. Admin APIs فيها تكرار

يوجد حالياً تكرار بين:

```txt
/admin/services
/services/admin

/admin/providers
/providers/admin

/admin/memberships
/subscriptions/admin/plans
```

الأفضل للفرونت اختيار مسار واحد ثابت لكل شاشة. حالياً لوحة الأدمن غالباً تستخدم `/admin/...`.

### 10. Wallet endpoints فيها `v1` إضافية

بسبب تركيب controller الحالي قد تكون المسارات:

```txt
/api/v1/v1/wallet/...
```

إذا واجهت 404 في المحفظة، افحص المسار الحقيقي في Postman/Swagger.

---

## 22. اقتراحات UI للفرونت

### صفحة تفاصيل الطلب

اعرض:

- معلومات الطلب
- الخدمة
- العميل
- المزود
- السيارة
- الدفع
- timeline من `status_histories`
- المحادثة
- التقييم إن وجد

### صفحة تفاصيل مزود في الأدمن

اعرض:

- بيانات المزود
- حالة الاعتماد
- الخدمات
- ساعات العمل
- الطلبات
- التقييمات
- سجل النشاطات من:

```http
GET /admin/audit-logs/entity/provider/:providerId
```

### صفحة سجل النشاطات

اعرض جدول:

| الوقت | الأدمن | العملية | النوع | السجل المتأثر | التفاصيل |
---|---|---|---|---|---|

وعند الضغط على "عرض":

- اسم الأدمن
- البريد
- نوع العملية
- الجدول المتأثر
- رقم السجل
- وقت العملية
- after
- metadata

### صفحة المحفظة

اعرض:

- balance
- pendingBalance
- loyaltyPoints
- transactions table
- status للعمليات

---

## 23. Checklist قبل ربط أي صفحة

قبل بناء أي شاشة frontend اسأل:

- ما هو الدور الذي يرى الصفحة؟ user أم provider أم admin؟
- ما هو endpoint الأساسي؟
- هل يحتاج token؟
- هل يوجد pagination؟
- هل يوجد status يجب ترجمته؟
- هل يوجد action حساس يجب أن يظهر في audit logs؟
- هل السجل مالي؟ إذا نعم، المصدر هو wallets/transactions فقط.
- هل الطلب حجز؟ إذا نعم، هو order مع `isScheduled=true`.
- هل تحتاج timeline؟ استخدم `status_histories`.

---

## 24. مصدر الحقيقة للفرونت

الأماكن التي يجب الرجوع لها عند الشك:

```txt
CAR_HERO_BACKEND/src/modules
CAR_HERO_BACKEND/postman/car_hero_backend.postman_collection.json
CAR_HERO_BACKEND/docs/database_structure.json
CAR_HERO_PHYSICAL_MODEL/src/data/collections.js
CAR_HERO_PHYSICAL_MODEL/src/data/endpoints.js
```

إذا تعارضت التسمية بين الواجهة والتوثيق، اعتبر الباك إند هو المصدر النهائي.
