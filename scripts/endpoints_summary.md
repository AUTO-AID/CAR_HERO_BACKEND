
# 📁 undefined

## 📁 chats - chat
- **[GET]** {{base_url}}/chat/{{chat_id}}/messages : GET /chat/:chatId/messages
  - *GetMessages*
- **[GET]** {{base_url}}/chat/conversations : GET /chat/conversations
  - *GetMyConversations*
- **[POST]** {{base_url}}/chat/conversations : POST /chat/conversations
  - *StartConversation*
- **[POST]** {{base_url}}/chat/upload : POST /chat/upload
  - *DiskStorage*

## 📁 notifications
- **[GET]** {{base_url}}/notifications : GET /notifications
  - *Get user notifications*
- **[PATCH]** {{base_url}}/notifications/{{notification_id}}/read : PATCH /notifications/:id/read
  - *Mark notification as read*
- **[PATCH]** {{base_url}}/notifications/read-all : PATCH /notifications/read-all
  - *Mark all notifications as read*
- **[GET]** {{base_url}}/notifications/unread-count : GET /notifications/unread-count
  - *Get unread notifications count*

## 📁 orders
- **[GET]** {{base_url}}/orders : GET /orders
  - *Get all orders (Paginated)*
- **[POST]** {{base_url}}/orders : POST /orders
  - *Create a new service order*
- **[GET]** {{base_url}}/orders/{{order_id}} : GET /orders/:id
  - *Get order details by ID*
- **[GET]** {{base_url}}/orders/{{order_id}}/status-transitions : GET /orders/:id/status-transitions
  - *Returns current order status, allowed next statuses from the backend state machine, and terminal flag.*
- **[GET]** {{base_url}}/orders/{{order_id}}/tracking : GET /orders/:id/tracking
  - *Get live provider tracking data for an order. Returns the latest provider position, destination, route trail, distance, ETA, freshness, and tracking availability. Auth: customer who owns the order, assigned provider, or admin.*
- **[PATCH]** {{base_url}}/orders/{{order_id}} : PATCH /orders/:id
  - *Update order details*
- **[POST]** {{base_url}}/orders/{{order_id}}/cancel : POST /orders/:id/cancel
  - *Cancel an order with a reason*
- **[POST]** {{base_url}}/orders/{{order_id}}/payment/verify : POST /orders/:id/payment/verify
  - *Verify and confirm payment for an order*
- **[POST]** {{base_url}}/orders/{{order_id}}/review : POST /orders/:id/review
  - *Review and rate an order*
- **[POST]** {{base_url}}/orders/{{order_id}}/customer-confirm-completion : POST /orders/:id/customer-confirm-completion

## 📁 bookings - scheduled orders
- **[POST]** {{base_url}}/bookings : POST /bookings
  - *Create a scheduled booking. This is a scheduled order stored in orders with isScheduled=true and scheduledAt set.*
- **[GET]** {{base_url}}/bookings : GET /bookings
  - *List scheduled bookings backed by the orders collection.*
- **[GET]** {{base_url}}/bookings/{{order_id}} : GET /bookings/:id
  - *Get scheduled booking details by order id.*

## 📁 providers
- **[GET]** {{base_url}}/providers/{{provider_id}} : GET /providers/:id
  - *Provider details*
- **[GET]** {{base_url}}/providers/nearby?longitude={{longitude}}&latitude={{latitude}}&maxDistanceKm={{max_distance_km}} : GET /providers/nearby
  - *List of nearby providers*
- **[GET]** {{base_url}}/providers/top-rated : GET /providers/top-rated
  - *Top rated providers*

## 📁 providers - reviews
- **[GET]** {{base_url}}/reviews/provider/{{provider_id}} : GET /reviews/provider/:providerId
  - *Get all reviews for a specific provider*

## 📁 reviews
- **[POST]** {{base_url}}/reviews : POST /reviews
  - *Create a new review for an order*
- **[DELETE]** {{base_url}}/reviews/{{review_id}} : DELETE /reviews/:id
  - *Delete a review*

## 📁 services
- **[GET]** {{base_url}}/services : GET /services
  - *List of services*
- **[GET]** {{base_url}}/services/{{service_id}} : GET /services/:id
  - *Get active service details by ID*
- **[GET]** {{base_url}}/services/categories : GET /services/categories
  - *Get active service categories with counts*
- **[GET]** {{base_url}}/services/emergency : GET /services/emergency
  - *Get all active emergency services*
- **[GET]** {{base_url}}/services/search : GET /services/search
  - *Search active services*

## 📁 subscription_plans - subscriptions
- **[POST]** {{base_url}}/subscriptions/cancel : POST /subscriptions/cancel
  - *Cancel current user subscription or disable auto renewal*
- **[GET]** {{base_url}}/subscriptions/history : GET /subscriptions/history
  - *Get current user subscription history*
- **[GET]** {{base_url}}/subscriptions/plans : GET /subscriptions/plans
  - *List of subscription plans*
- **[GET]** {{base_url}}/subscriptions/plans/{{subscription_plan_id}} : GET /subscriptions/plans/:id
  - *Get subscription plan details*
- **[POST]** {{base_url}}/subscriptions/renew : POST /subscriptions/renew
  - *Renew current user active subscription*
- **[GET]** {{base_url}}/subscriptions/status : GET /subscriptions/status
  - *Check current user subscription status*
- **[POST]** {{base_url}}/subscriptions/subscribe : POST /subscriptions/subscribe
  - *Subscribe the current user to a plan*
- **[POST]** {{base_url}}/subscriptions/upgrade : POST /subscriptions/upgrade
  - *Upgrade current user to another subscription plan*

## 📁 users
- **[DELETE]** {{base_url}}/users/me : DELETE /users/me
  - *Account deleted successfully*
- **[GET]** {{base_url}}/users/me : GET /users/me
  - *User profile retrieved successfully*
- **[PATCH]** {{base_url}}/users/me : PATCH /users/me
  - *User profile updated successfully*
- **[GET]** {{base_url}}/users/me/stats : GET /users/me/stats
  - *User statistics retrieved successfully*

## 📁 users - auth
- **[POST]** {{base_url}}/auth/forgot-password : POST /auth/forgot-password
  - *Request OTP to reset password*
- **[POST]** {{base_url}}/auth/login : POST /auth/login
  - *Login with phone number and password*
- **[POST]** {{base_url}}/auth/logout : POST /auth/logout
  - *Logout and invalidate refresh token*
- **[GET]** {{base_url}}/auth/me : GET /auth/me
  - *Get authenticated user information from JWT token*
- **[POST]** {{base_url}}/auth/refresh-token : POST /auth/refresh-token
  - *Get new access token using refresh token*
- **[POST]** {{base_url}}/auth/register : POST /auth/register
  - *Create a new user account and send OTP via WhatsApp*
- **[POST]** {{base_url}}/auth/resend-otp : POST /auth/resend-otp
  - *Resend OTP to phone number via WhatsApp*
- **[POST]** {{base_url}}/auth/reset-password : POST /auth/reset-password
  - *Reset password using OTP code*
- **[POST]** {{base_url}}/auth/restore/confirm : POST /auth/restore/confirm
  - *Verify OTP and restore deleted account*
- **[POST]** {{base_url}}/auth/restore/request-otp : POST /auth/restore/request-otp
  - *Send OTP to restore soft-deleted account*
- **[POST]** {{base_url}}/auth/verify-otp : POST /auth/verify-otp
  - *Verify OTP and activate account*
- **[GET]** {{base_url}}/auth/whatsapp/status : GET /auth/whatsapp/status
  - *Check WhatsApp connection status*

## 📁 vehicles
- **[POST]** {{base_url}}/vehicles : POST /vehicles
  - *Vehicle created successfully*
- **[DELETE]** {{base_url}}/vehicles/{{vehicle_id}} : DELETE /vehicles/:id
  - *Vehicle deleted successfully*
- **[GET]** {{base_url}}/vehicles/{{vehicle_id}} : GET /vehicles/:id
  - *Vehicle details*
- **[PATCH]** {{base_url}}/vehicles/{{vehicle_id}} : PATCH /vehicles/:id
  - *Vehicle updated successfully*
- **[GET]** {{base_url}}/vehicles/{{vehicle_id}}/maintenance : GET /vehicles/:vehicleId/maintenance
  - *Page number*
- **[POST]** {{base_url}}/vehicles/{{vehicle_id}}/maintenance : POST /vehicles/:vehicleId/maintenance
  - *Maintenance record created successfully*
- **[GET]** {{base_url}}/vehicles/{{vehicle_id}}/reminders : GET /vehicles/:vehicleId/reminders
  - *Page number*
- **[POST]** {{base_url}}/vehicles/{{vehicle_id}}/reminders : POST /vehicles/:vehicleId/reminders
  - *Reminder created successfully*
- **[PATCH]** {{base_url}}/vehicles/{{vehicle_id}}/set-default : PATCH /vehicles/:id/set-default
  - *Vehicle set as default successfully*
- **[DELETE]** {{base_url}}/vehicles/maintenance/{{maintenance_record_id}} : DELETE /vehicles/maintenance/:id
  - *Maintenance record deleted successfully*
- **[PATCH]** {{base_url}}/vehicles/maintenance/{{maintenance_record_id}} : PATCH /vehicles/maintenance/:id
  - *Maintenance record updated successfully*
- **[GET]** {{base_url}}/vehicles/my : GET /vehicles/my
  - *Page number*
- **[DELETE]** {{base_url}}/vehicles/reminders/{{vehicle_reminder_id}} : DELETE /vehicles/reminders/:id
  - *Reminder deleted successfully*
- **[GET]** {{base_url}}/vehicles/search : GET /vehicles/search
  - *Search query*

## 📁 wallets - wallet
- **[POST]** {{base_url}}/wallet/deposit : POST /wallet/deposit
  - *Deposit*
- **[GET]** {{base_url}}/wallet/me : GET /wallet/me
  - *GetMyWallet*
- **[GET]** {{base_url}}/wallet/transactions : GET /wallet/transactions
  - *GetTransactions*
- **[POST]** {{base_url}}/wallet/redeem-points : POST /wallet/redeem-points
  - *Atomically redeem loyalty points and record the redemption transaction.*

## 📁 AI Recommendation Engine
- **[POST]** {{base_url}}/ai/recommend-provider : POST /ai/recommend-provider (Success Request)
  - *Request smart recommendations for towing service providers in Damascus using the active AI/Rule mode.*
- **[POST]** {{base_url}}/ai/recommend-provider : POST /ai/recommend-provider (Fallback Request)
  - *Request recommendations for a non-existent specialty category. This triggers the fallback query to find general active providers in Damascus.*
- **[POST]** {{base_url}}/ai/recommend-provider : POST /ai/recommend-provider (With Exclusion List Request)
  - *Request recommendations excluding specific providers that failed to respond or accept the order.*

## 📁 customer - addresses
- **[GET]** {{base_url}}/customer/addresses : GET /customer/addresses
  - *List saved addresses for the authenticated customer.*
- **[POST]** {{base_url}}/customer/addresses : POST /customer/addresses
  - *Create a saved customer address.*
- **[PATCH]** {{base_url}}/customer/addresses/{{address_id}} : PATCH /customer/addresses/{{address_id}}
  - *Update an owned saved address.*
- **[PATCH]** {{base_url}}/customer/addresses/{{address_id}}/set-default : PATCH /customer/addresses/{{address_id}}/set-default
  - *Set an owned address as default.*
- **[DELETE]** {{base_url}}/customer/addresses/{{address_id}} : DELETE /customer/addresses/{{address_id}}
  - *Delete an owned saved address.*

## 📁 customer - payment methods
- **[GET]** {{base_url}}/customer/payment-methods : GET /customer/payment-methods
  - *List tokenized payment methods for the authenticated customer.*
- **[POST]** {{base_url}}/customer/payment-methods : POST /customer/payment-methods
  - *Create a tokenized payment method. Never send a full card number or CVV.*
- **[PATCH]** {{base_url}}/customer/payment-methods/{{payment_method_id}} : PATCH /customer/payment-methods/{{payment_method_id}}
  - *Update an owned tokenized payment method.*
- **[PATCH]** {{base_url}}/customer/payment-methods/{{payment_method_id}}/set-default : PATCH /customer/payment-methods/{{payment_method_id}}/set-default
  - *Set an owned payment method as default.*
- **[DELETE]** {{base_url}}/customer/payment-methods/{{payment_method_id}} : DELETE /customer/payment-methods/{{payment_method_id}}
  - *Delete an owned non-cash payment method.*

## 📁 customer - offers
- **[GET]** {{base_url}}/customer/offers : GET /customer/offers
  - *List active offers currently available to the customer.*
- **[POST]** {{base_url}}/customer/offers/{{offer_id}}/apply : POST /customer/offers/{{offer_id}}/apply
  - *Reserve or apply an offer for the authenticated customer.*

## 📁 customer - wash plans
- **[GET]** {{base_url}}/customer/wash-plans : GET /customer/wash-plans
  - *List recurring wash plans for the authenticated customer.*
- **[POST]** {{base_url}}/customer/wash-plans : POST /customer/wash-plans
  - *Create a recurring wash plan.*
- **[PATCH]** {{base_url}}/customer/wash-plans/{{wash_plan_id}} : PATCH /customer/wash-plans/{{wash_plan_id}}
  - *Update an owned recurring wash plan.*
- **[DELETE]** {{base_url}}/customer/wash-plans/{{wash_plan_id}} : DELETE /customer/wash-plans/{{wash_plan_id}}
  - *Delete an owned recurring wash plan.*
- **[POST]** {{base_url}}/customer/wash-plans/{{wash_plan_id}}/generate-booking : POST /customer/wash-plans/:id/generate-booking

## 📁 customer - devices
- **[POST]** {{base_url}}/customer/devices : POST /customer/devices
  - *Register or refresh an FCM token for push notifications.*
- **[DELETE]** {{base_url}}/customer/devices/{{device_token}} : DELETE /customer/devices/{{device_token}}
  - *Deactivate a registered push-notification device token.*
