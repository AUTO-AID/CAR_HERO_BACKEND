# CAR_HERO_BACKEND Technical and Functional Documentation

Source analyzed: `CAR_HERO_BACKEND` source code on 2026-06-20.

This document is the backend reference for Car Hero. It describes the real NestJS implementation found in this repository: modules, API routes, schemas, workflows, security, operational configuration, business rules, and developer onboarding. It intentionally avoids marketing language and does not invent capabilities that are not present in the source code.

## Table of Contents

1. [Backend Overview](#1-backend-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [System Architecture](#4-system-architecture)
5. [Module Documentation](#5-module-documentation)
6. [Database Architecture](#6-database-architecture)
7. [Entity Relationship Documentation](#7-entity-relationship-documentation)
8. [Authentication and Authorization](#8-authentication-and-authorization)
9. [API Documentation](#9-api-documentation)
10. [Provider Registration Workflow](#10-provider-registration-workflow)
11. [Orders System](#11-orders-system)
12. [Subscription System](#12-subscription-system)
13. [Wallet and Financial System](#13-wallet-and-financial-system)
14. [Reviews and Ratings System](#14-reviews-and-ratings-system)
15. [Notifications System](#15-notifications-system)
16. [Messaging and Chat System](#16-messaging-and-chat-system)
17. [Admin Features](#17-admin-features)
18. [Provider Features](#18-provider-features)
19. [User Features](#19-user-features)
20. [Validation Layer](#20-validation-layer)
21. [Error Handling](#21-error-handling)
22. [External Integrations](#22-external-integrations)
23. [Environment Configuration](#23-environment-configuration)
24. [Security Architecture](#24-security-architecture)
25. [Performance and Scalability](#25-performance-and-scalability)
26. [Complete Business Logic Inventory](#26-complete-business-logic-inventory)
27. [Developer Guide](#27-developer-guide)
28. [Known Limitations](#28-known-limitations)
29. [Complete Backend Feature Inventory](#29-complete-backend-feature-inventory)
30. [How CAR_HERO_BACKEND Works Internally](#30-how-car_hero_backend-works-internally)

---

## 1. Backend Overview

`CAR_HERO_BACKEND` is the NestJS API server for the Car Hero ecosystem. It exposes REST APIs and Socket.IO gateways used by:

- Website: public service discovery, provider registration, authentication, bookings, payments, and customer experience features.
- Mobile App: customer account, vehicles, orders, subscriptions, wallet, chat, notifications, geolocation tracking, and recommendations.
- Admin Dashboard: provider/user/service/order/subscription/wallet/audit/settings/statistics management.
- Provider Dashboard: provider profile, services, working hours, documents, bank account, orders, wallet, payouts, reviews, and dashboard analytics.
- Database: MongoDB accessed through Mongoose models and repositories.

The backend is responsible for:

- User, provider, and admin authentication.
- OTP based registration and account restoration.
- Provider onboarding and approval.
- Service catalog management.
- Order and booking lifecycle management.
- Provider location tracking.
- Wallet, payout, transaction, subscription, and loyalty point logic.
- Review and provider rating aggregation.
- In-app, push, and real-time notifications.
- Chat and message storage.
- Admin analytics and audit logs.
- AI/rule-based provider recommendation.
- Customer experience features such as addresses, payment methods, offers, recurring wash plans, and device registration.

High level architecture:

```text
Clients
  Website / Mobile App / Admin Dashboard / Provider Dashboard
    |
    | HTTP REST: /api/v1/*
    | Socket.IO: /ws, /chat, /notifications
    v
NestJS Application
  main.ts bootstrap
  CoreModule global guards, pipes, filters, interceptors
  AppModule imports feature modules
    |
    v
Feature Modules
  controllers -> use cases/services -> repositories -> Mongoose schemas
    |
    v
MongoDB
  users, providers, orders, services, wallets, transactions, notifications, ...
```

The API prefix defaults to `/api/v1`, controlled by `API_PREFIX`.

---

## 2. Technology Stack

| Technology | Where Used | Responsibility |
| --- | --- | --- |
| NestJS 11 | Entire backend | Modular server framework, dependency injection, controllers, guards, pipes, interceptors, modules, gateways. |
| TypeScript 5.7 | Entire backend | Strong typing for DTOs, entities, services, repositories, and Nest contracts. |
| MongoDB | Database | Primary persistence layer for users, providers, orders, services, wallets, notifications, etc. |
| Mongoose 9 | Infrastructure persistence | Schema definitions, indexes, validation, aggregation pipelines, repository implementations. |
| `@nestjs/mongoose` | AppModule and modules | Nest integration for Mongoose models. |
| `@nestjs/config` | `src/config/*` | Loads `.env`, `.env.local`, and typed config values. |
| Passport JWT | Auth module and core guards | Bearer token authentication for HTTP APIs. |
| `@nestjs/jwt` | Auth/Admin auth/WS auth | Access and refresh token generation and verification. |
| `bcrypt` | Password and refresh-token hashing | Hashes passwords and stored refresh tokens. |
| `class-validator` | DTO classes | Request validation: Mongo IDs, strings, enums, ranges, booleans, nested objects. |
| `class-transformer` | DTO classes and global pipe | Converts query/body values and supports nested DTO transformation. |
| `helmet` | `main.ts` | HTTP security headers; CSP is disabled in current bootstrap. |
| `@nestjs/throttler` | AppModule and AuthController | Rate limiting configured globally in module and applied to auth controller. |
| `@nestjs/cache-manager` / `cache-manager` | Core features, vehicles, orders, AI | Cache abstraction for selected query/use-case results. Redis packages exist but CacheModule is configured as in-memory in AppModule. |
| `@nestjs/schedule` | Customer experience | Hourly recurring wash plan generation. |
| `@nestjs/event-emitter` | Orders, reviews, AI metrics, gateway events | Internal domain event propagation. |
| Socket.IO / `@nestjs/websockets` | Gateway, chat, notifications | Realtime order, chat, notification, provider location events. |
| Firebase Admin | Notifications service | Optional push notifications through FCM if credentials exist. |
| `whatsapp-web.js`, `qrcode`, `qrcode-terminal` | WhatsApp module | WhatsApp QR login/status/send-message tooling. OTP sending is currently disabled in dev code. |
| Multer | Providers and chat upload endpoints | Document and chat file upload handling. |
| Swagger | `main.ts` | API documentation at `/api-docs` and JSON at `/api-docs-json`. |
| EJS | `main.ts`, WhatsApp views | View engine for WhatsApp QR pages. |
| Axios | Mock Cham Cash controller | Sends mock webhook back into backend. |
| Jest, ts-jest, supertest, mongodb-memory-server | Tests | Unit, HTTP, and e2e testing. |
| ESLint and Prettier | Development | Linting and formatting. |

---

## 3. Project Structure

```text
CAR_HERO_BACKEND/
  .env.example
  package.json
  nest-cli.json
  tsconfig.json
  src/
    main.ts
    app.module.ts
    app.controller.ts
    app.service.ts
    config/
      env.config.ts
      mongo.config.ts
      swagger.config.ts
      constants.ts
    core/
      constants/
      decorators/
      dtos/
      enums/
      filters/
      guards/
      interceptors/
      interfaces/
      pipes/
      utils/
      core.module.ts
    modules/
      admin/
      ai-recommendation/
      audit/
      auth/
      chat/
      customer-experience/
      gateway/
      notifications/
      orders/
      payments/
      profile/
      providers/
      reviews/
      services/
      status-history/
      subscriptions/
      users/
      vehicles/
      wallet/
      whatsapp/
  test/
  uploads/
  views/
  scripts/
  postman/
  maps-generator/
  ai-training/
```

Important files:

- `src/main.ts`: application bootstrap, CORS, Helmet, validation pipe, static uploads, views, Swagger, global prefix.
- `src/app.module.ts`: root module imports all feature modules and configures MongoDB, cache, throttling, scheduling, events.
- `src/core/core.module.ts`: global filter, validation pipe, transform/logging interceptors, JWT auth guard, maintenance guard.
- `src/config/env.config.ts`: centralized runtime config.
- `src/config/mongo.config.ts`: Mongoose connection config.
- `src/config/swagger.config.ts`: Swagger document configuration.
- `src/config/constants.ts`: AI recommendation scoring weights and constants.
- `src/core/enums/status.enum.ts`: canonical order/payment/provider/subscription/notification/service statuses.
- `src/core/enums/roles.enum.ts`: role enum: `user`, `provider`, `admin`.
- `uploads/`: runtime file storage for uploaded documents and chat files.
- `views/`: EJS views used by the WhatsApp module.

Feature module pattern:

```text
module/
  application/
    dto(s)/
    services/
    use-cases/
  domain/
    entities/
    repositories/
    events/
  infrastructure/
    persistence/
      mongoose/
        schemas/
        repositories/
  presentation/
    controllers/
    gateways/
```

Not every module uses every folder, but the dominant architecture separates presentation, application logic, domain contracts/entities, and persistence.

---

## 4. System Architecture

### Application Bootstrap

`main.ts` creates a `NestExpressApplication` and configures:

- EJS view engine.
- Static `/uploads` route.
- Helmet with `contentSecurityPolicy: false`.
- CORS with `origin: true`, all common HTTP methods, and `credentials: true`.
- Global validation pipe with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- Global API prefix from config, default `api/v1`.
- Swagger at `/api-docs`, JSON at `/api-docs-json`.

### Global Core Behavior

`CoreModule` registers:

- `HttpExceptionFilter` globally for `HttpException` responses.
- Global `ValidationPipe` with implicit conversion enabled.
- `TransformInterceptor` globally, wrapping successful responses:

```json
{
  "success": true,
  "data": {},
  "timestamp": "ISO_DATE"
}
```

- `LoggingInterceptor` globally, logging request and response time.
- `JwtAuthGuard` globally. Routes must use `@Public()` to bypass JWT.
- `MaintenanceGuard` globally. Public routes and admin users bypass maintenance mode.

`ResponseInterceptor`, `AllExceptionsFilter`, and `TimeoutInterceptor` exist in source but are not registered globally in `CoreModule`.

### Request Lifecycle

```text
HTTP request
  -> CORS / Helmet / Express
  -> Global JWT guard, unless @Public()
  -> Global maintenance guard
  -> Controller route guards such as RolesGuard or PermissionsGuard
  -> Global ValidationPipe
  -> Controller method
  -> Application use case or service
  -> Repository / Mongoose model
  -> MongoDB
  -> TransformInterceptor wraps response
```

### Data Layer

The backend uses Mongoose schemas and models directly in some services and through repository interfaces in modules such as orders, providers, users, vehicles, reviews, subscriptions, and wallet. Most complex business logic is held in use cases or application services.

### Realtime Architecture

There are three Socket.IO namespaces:

- `/ws`: general order, provider location, provider status, and lightweight chat events.
- `/chat`: secure chat room membership, message send/read/typing, online/offline presence.
- `notifications`: notification room join and unread count delivery.

WebSocket authentication uses `WsJwtGuard`, which accepts a token from `Authorization: Bearer <token>` or `handshake.auth.token`.

---

## 5. Module Documentation

### App Module

- Module file: `src/app.module.ts`
- Controllers: `AppController`
- Services: `AppService`
- APIs:
  - `GET /api/v1/`
  - `GET /api/v1/system/schemas`
- Responsibility: root assembly, MongoDB connection, cache, event bus, schedule, throttling, and all feature modules.

### Core Module

- Module file: `src/core/core.module.ts`
- Guards: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, `MaintenanceGuard`, `WsJwtGuard`
- Filters: `HttpExceptionFilter`, `AllExceptionsFilter`
- Interceptors: `TransformInterceptor`, `LoggingInterceptor`, `ResponseInterceptor`, `TimeoutInterceptor`
- Pipes: `ParseObjectIdPipe`, global `ValidationPipe`
- Decorators: `@CurrentUser`, `@Public`, `@Roles`, `@Permissions`
- Responsibility: cross-cutting behavior, auth enforcement, response wrapping, validation, errors, constants, enums, utility functions.

### Admin Module

- Module file: `src/modules/admin/admin.module.ts`
- Controller: `AdminController`
- Services and use cases:
  - `AdminAuthService`
  - `AdminAdminsService`
  - `AdminUsersService`
  - `AdminProvidersService`
  - `AdminServicesService`
  - `AdminStatsService`
  - `AdminMembershipsService`
  - `AdminSubscriptionsService`
  - `AdminSettingsService`
  - Login use case
- Schemas: `Admin`, `Setting`
- DTOs: admin login, admin management, membership/subscription plan, settings.
- Responsibilities:
  - Admin login, refresh, logout, profile.
  - Provider approval/rejection and management.
  - Service management.
  - Dashboard statistics and Excel-style summaries.
  - Subscription plan management.
  - Settings and maintenance mode.
  - Admin account management.
- Dependencies: users, providers, orders, services, subscriptions, notifications, settings.

### Auth Module

- Module file: `src/modules/auth/auth.module.ts`
- Controller: `AuthController`
- Services: `AuthService`, `OtpService`
- Strategy: `JwtStrategy`
- Schemas: `PendingRegistration`, `Logout`, also reads `User`, `Provider`, `Admin`.
- DTOs: register, login, verify OTP, refresh token, forgot/reset password, restore request/confirm.
- Responsibilities:
  - Customer/provider registration through pending registration and OTP.
  - Login and refresh token flow.
  - Password reset through OTP.
  - Account restoration through OTP.
  - Logout tracking.
  - Provider placeholder creation during provider registration verification.
- Dependencies: WhatsApp service, notifications, users, providers, admins.

### Users Module

- Module file: `src/modules/users/users.module.ts`
- Controllers: `UsersController`, `AdminUsersController`
- Use cases: get profile, update profile, delete account, get user stats, admin list/details/update/status/delete.
- Schema: `User`
- DTOs: create/update user.
- Responsibilities:
  - Customer/provider profile APIs.
  - Preferences update.
  - Soft/deactivation style account deletion through repository behavior.
  - Admin user search and management.

### Providers Module

- Module file: `src/modules/providers/providers.module.ts`
- Controller: `ProvidersController`
- Use cases/services:
  - `ManageProvidersUseCase`
  - `ApproveProviderUseCase`
  - provider list/details/use cases
  - provider location/status/profile/dashboard use cases
  - `RecalculateProviderRatingUseCase`
- Schema: `Provider`
- DTOs: create/update provider, query nearby/list, profile, services, working hours, documents, bank account, reject provider.
- Responsibilities:
  - Public provider listing, top-rated, nearby search, public statistics.
  - Public provider application.
  - Provider self-profile management.
  - Provider services, availability, working hours, documents, bank account.
  - Provider dashboard summary/orders/revenue/service performance.
  - Admin provider management.
- Business adapter: maps legacy/provider website fields such as `services_list`, `requestedServices`, and `servicePrices` into canonical provider fields.

### Services Module

- Module file: `src/modules/services/services.module.ts`
- Controller: `ServicesController`
- Use cases: manage services, list services, service details, service stats.
- Schema: `Service`
- DTOs: create service, update service, list query.
- Responsibilities:
  - Public service catalog.
  - Public category, emergency, search, and detail endpoints.
  - Admin service CRUD and stats.

### Orders Module

- Module file: `src/modules/orders/orders.module.ts`
- Controller: `OrdersController`
- Use cases:
  - create order/booking
  - assign provider
  - get orders
  - get order by ID
  - update status
  - cancel order
  - confirm completion
  - verify payment
  - update provider location
  - search/report/stats/status history
  - review order
- Domain: `OrderEntity`, `OrderStateMachine`, order events.
- Schema: `Order`
- DTOs: create order, cancel order, review order, update location, verify payment.
- Dependencies: services, providers, vehicles, wallet, notifications, status history, event emitter, cache.
- Responsibilities:
  - Immediate orders and scheduled bookings.
  - State machine based order status transitions.
  - Provider assignment and service price selection.
  - Cancellation/refund logic.
  - Provider earnings transfer on completion.
  - Location tracking and history.

### Status History Module

- Module file: `src/modules/status-history/status-history.module.ts`
- Controller: `StatusHistoryController`
- Schema: `StatusHistory`
- Responsibilities:
  - Store and expose entity status changes, primarily orders.
  - Admin status history search.

### Wallet Module

- Module file: `src/modules/wallet/wallet.module.ts`
- Controllers: `UserWalletController`, `ProviderWalletController`, `AdminWalletController`
- Use cases:
  - get wallet
  - deposit
  - withdraw
  - request payout
  - process payout
  - list transactions
  - redeem loyalty points
  - transfer earnings
  - admin wallet adjustments and stats
- Schemas: `Wallet`, `Transaction`
- DTOs: deposit, withdraw, payout, process payout, admin adjustment, redeem points.
- Responsibilities:
  - Wallet creation and transaction execution.
  - Provider payouts.
  - Platform commission accounting.
  - Loyalty point redemption.
  - Admin financial oversight.

### Subscriptions Module

- Module file: `src/modules/subscriptions/subscriptions.module.ts`
- Controller: `SubscriptionsController`
- Use cases:
  - list/get plans
  - subscribe
  - renew
  - upgrade
  - cancel
  - status/history
  - admin list/stats/plan CRUD
  - subscription lifecycle
- Schemas: `SubscriptionPlan`, `UserSubscription`
- DTOs: subscribe, cancel, create/update plan, list subscriptions query.
- Responsibilities:
  - Subscription plan catalog.
  - User subscription lifecycle.
  - Wallet charging for paid plans.
  - User premium state synchronization.
  - Admin subscription management.

### Reviews Module

- Module file: `src/modules/reviews/reviews.module.ts`
- Controller: `ReviewsController`
- Use cases:
  - create review
  - provider review list
  - respond to review
  - update/delete review
  - rating stats
- Schema: `Review`
- DTOs: review creation/update/query/response DTOs.
- Responsibilities:
  - Completed-order review creation.
  - One review per order.
  - Provider response to reviews.
  - Recalculate provider rating after create/delete.
  - Emit `review.created` for AI metrics recalculation.

### Notifications Module

- Module file: `src/modules/notifications/notifications.module.ts`
- Controller: `NotificationsController`
- Gateway: `NotificationsGateway`
- Service: `NotificationsService`
- Schema: `Notification`
- Responsibilities:
  - Persist notifications.
  - Deliver real-time notifications to Socket.IO rooms.
  - Optional FCM delivery through Firebase Admin.
  - Unread counts and read states.
  - Admin broadcast campaigns with optional scheduling.
  - Scheduled notification dispatch every 60 seconds.

### Chat Module

- Module file: `src/modules/chat/chat.module.ts`
- Controller: `ChatController`
- Gateway: `ChatGateway`
- Service: `ChatService`
- Schemas: `Chat`, `Message`
- DTOs: create chat, send message, message type.
- Responsibilities:
  - Per-order one-to-one chat creation.
  - Participant validation against order user/provider.
  - Message persistence.
  - Read state and unread counts.
  - File upload for chat attachments.
  - Realtime chat rooms, typing, read receipts, online presence.

### Customer Experience Module

- Module file: `src/modules/customer-experience/customer-experience.module.ts`
- Controllers: `CustomerExperienceController`, `AdminOffersController`
- Service: `CustomerExperienceService`
- Cron: `CustomerExperienceCronService`
- Schemas: `UserAddress`, `UserPaymentMethod`, `Offer`, `OfferRedemption`, `WashPlan`, `UserDevice`
- DTOs: address, payment method, offer, wash plan, device registration.
- Responsibilities:
  - Customer saved addresses.
  - Customer payment methods.
  - Offers and redemptions.
  - Recurring wash plans and generated scheduled bookings.
  - FCM device registration.
  - Admin offer CRUD.

### Vehicles Module

- Module file: `src/modules/vehicles/vehicles.module.ts`
- Controllers: `VehiclesController`, `AdminVehiclesController`
- Use cases:
  - create/update/delete vehicles
  - set default vehicle
  - search/list/get vehicles
  - maintenance records
  - reminders
  - admin stats/distribution/top models/details/delete/user vehicles
- Schemas: `Vehicle`, `MaintenanceRecord`, `VehicleReminder`
- DTOs: create/update vehicle, maintenance record, vehicle reminder.
- Responsibilities:
  - User vehicle inventory.
  - Vehicle ownership enforcement.
  - Maintenance history and reminders.
  - Admin vehicle analytics.

### Payments Module

- Module file: `src/modules/payments/payments.module.ts`
- Controllers: `PaymentsController`, `MockChamCashController`
- Services: `PaymentsService`, `ChamCashService`
- Schema: `PaymentIntent`
- DTOs: initialize payment.
- Responsibilities:
  - Initialize mock Cham Cash payment intents.
  - Render mock checkout page.
  - Process mock payment and self-call webhook.
  - Verify webhook signature.
  - Fulfill wallet top-ups.

### AI Recommendation Module

- Module file: `src/modules/ai-recommendation/ai-recommendation.module.ts`
- Controllers: `AiRecommendationController`, `AiAnalyticsController`
- Services:
  - `AiRecommendationService`
  - `ProviderScoringService`
  - `AiAnalyticsService`
  - `ProviderMetricsService`
  - `ModelRetrainingService`
- Providers:
  - `RuleBasedRecommendationProvider`
  - `MlRecommendationProvider`
- Schemas: `AiRecommendationLog`, `ProviderMetrics`
- DTOs: recommend provider, recommendation response, analytics response.
- Responsibilities:
  - Recommend providers by service, city, location, urgency, availability, score, confidence.
  - Cache recommendation outputs.
  - Optional ML inference via `AI_SERVICE_URL`.
  - Rule-based fallback.
  - Admin analytics over recommendation logs.
  - Provider metrics recalculation.

### Gateway Module

- Module file: `src/modules/gateway/gateway.module.ts`
- Gateway: `AppGateway`
- Responsibilities:
  - General `/ws` realtime namespace.
  - Order room join/leave.
  - Order status and provider location updates.
  - Provider profile location updates.
  - Broadcast persisted order location events.
  - Lightweight chat forwarding events.

### Audit Module

- Module file: `src/modules/audit/audit.module.ts`
- Controller: `AuditLogController`
- Service: audit log service
- Schema: `AuditLog`
- Responsibilities:
  - Admin audit log list, stats, export, and entity history.
  - Tracks admin action, entity, before/after, metadata, IP, user agent.

### WhatsApp Module

- Module file: `src/modules/whatsapp/whatsapp.module.ts`
- Controller: `WhatsAppController`
- Service: `WhatsAppWebService`
- Responsibilities:
  - WhatsApp QR login/status.
  - Send WhatsApp messages when service is ready.
  - Restart WhatsApp client.
  - Protected by admin JWT/roles/permissions for sensitive actions.

### Profile Module

- Module file: `src/modules/profile/profile.module.ts`
- Controller: `ProfileController`
- Current implementation: controller exists at `/profile`, but no routes are defined in the analyzed file.

---

## 6. Database Architecture

### Collection Inventory

| Collection / Schema | Purpose | Important Fields | Indexes / Constraints |
| --- | --- | --- | --- |
| `admins` / `Admin` | Admin accounts | `name`, `email`, `password`, `role`, `permissions`, `isActive`, `refreshToken`, `lastLoginAt`, `avatar`, metadata | `email` unique, `isActive` index |
| `settings` / `Setting` | Runtime app settings and maintenance mode | `key`, `value`, `maintenanceMode`, `maintenanceMessage`, `maintenanceMessageAr`, `group`, `isPublic` | `key` unique, `group` index |
| `users` / `User` | Customer/provider/admin user accounts | `fullName`, `phoneNumber`, `password`, `accountType`, `role`, `isPremium`, `premiumExpiresAt`, `preferences`, `isActive`, `isVerified`, OTP fields, `refreshToken`, `fcmToken`, `vehicles`, `activeSubscription` | `phoneNumber` unique, indexes on account type, premium expiry, active/verified, createdAt |
| `pending_registrations` / `PendingRegistration` | Temporary registration records before OTP verification | `phoneNumber`, `fullName`, hashed `password`, `accountType`, `isTermsAccepted`, OTP fields, `expiresAt` | `phoneNumber` unique, TTL via `expiresAt` |
| `logouts` / `Logout` | Logout audit records | `userId`, `refreshTokenHash`, `ipAddress`, `userAgent`, `success`, `reason` | default timestamps |
| `providers` / `Provider` | Service providers | phone/contact fields, business fields, category, status, approval fields, location, coverage, services, service prices, availability, emergency flags, working hours, rating stats, documents, bank account | `location` 2dsphere, status, categories, active/approved, rating, createdAt, governorate, city, accountType |
| `services` / `Service` | Service catalog | `name`, `nameAr`, descriptions, `category`, prices, duration, icon/image, emergency/active/system flags, options, provider | text index, category/active/sort, system/active, provider/active |
| `orders` / `Order` | Customer service requests and scheduled bookings | `orderNumber`, `user`, `provider`, `service`, `vehicle`, `status`, amounts, location, provider location/history, schedule, payment, notes, timestamps, cancellation, rating, metadata | user/provider/status indexes, location 2dsphere, providerLocation 2dsphere, createdAt |
| `status_histories` / `StatusHistory` | Status audit trail | `entityType`, `entityId`, `orderNumber`, `fromStatus`, `toStatus`, `changedBy`, `changedByRole`, `reason`, metadata | entity/date, orderNumber/date, changedBy/date, toStatus/date |
| `wallets` / `Wallet` | User/provider/system wallets | `ownerId`, `ownerType`, `balance`, `pendingBalance`, `loyaltyPoints`, `currency`, `isActive`, metadata | unique `ownerId + ownerType` |
| `transactions` / `Transaction` | Financial ledger | `transactionNumber`, `wallet`, `ownerId`, `ownerType`, `type`, `amount`, balances, description, reference, payment, status, points | transaction number unique, wallet/date, owner/date, type, reference, partial unique for order loyalty redemption |
| `subscription_plans` / `SubscriptionPlan` | Subscription plan catalog | `name`, `nameAr`, descriptions, `price`, `durationDays`, features, tier, active, sortOrder | active, tier, sortOrder indexes |
| `user_subscriptions` / `UserSubscription` | User subscription instances | `user`, `plan`, `startDate`, `endDate`, `status`, `autoRenew`, cancellation, payment, amountPaid | user/status, endDate, plan indexes |
| `reviews` / `Review` | Provider/order reviews | `user`, `provider`, `order`, `rating`, comment, score dimensions, images, report/flag fields, provider response, visibility | provider/date, user, order unique sparse, rating |
| `notifications` / `Notification` | Notifications and campaigns | `recipientId`, `recipientType`, `title`, `body`, `type`, `data`, campaign fields, delivery status, schedule, read state | recipient/read, createdAt, campaignId, deliveryStatus/scheduledAt |
| `chats` / `Chat` | Per-order conversations | `orderId`, `participants`, `isActive`, `lastMessageAt`, `lastMessage`, `lastMessageBy`, `unreadCounts` | orderId, participants, lastMessageAt |
| `messages` / `Message` | Chat messages | `chatId`, `senderId`, `receiverId`, `message`, `type`, file/location fields, read state | associated with chat schema indexes |
| `vehicles` / `Vehicle` | User vehicles | `owner`, `brand`, `model`, `year`, `plateNumber`, `color`, `vin`, image, default/active, metadata | owner, plateNumber |
| `maintenance_records` / `MaintenanceRecord` | Vehicle maintenance history | `vehicle`, `user`, service type, description, date, mileage, cost, provider, location, parts, attachments | vehicle/date, user |
| `vehicle_reminders` / `VehicleReminder` | Vehicle maintenance reminders | `vehicle`, `user`, type, title, dates/mileage, frequency, active, recurring | vehicle/active/date, user, date/active |
| `user_addresses` / `UserAddress` | Customer addresses | `userId`, label, addressLine, note, location, default | user/default, location 2dsphere |
| `user_payment_methods` / `UserPaymentMethod` | Saved payment methods | `userId`, type, displayName, card metadata, `providerToken`, default | user/default |
| `offers` / `Offer` | Promo offers | code, title, description, type, value, active date range, metadata | code unique uppercase, active/date |
| `offer_redemptions` / `OfferRedemption` | Offer usage | `userId`, `offerId`, `orderId`, status | unique user + offer |
| `wash_plans` / `WashPlan` | Recurring wash plans | `userId`, `vehicleId`, `addressId`, visits/month, washType, time slot, reminder, active, next/last booking | user/vehicle, active/nextBookingAt |
| `user_devices` / `UserDevice` | FCM device records | `userId`, `fcmToken`, platform, deviceName, active, lastSeenAt | fcmToken unique, user/active |
| `payment_intents` / `PaymentIntent` | Mock Cham Cash intents | `userId`, amount, currency, purpose, status, referenceId, gatewayUrl, targetId, metadata | repository lookup by referenceId |
| `ai_recommendation_logs` / `AiRecommendationLog` | Recommendation audit logs | user, criteria, candidate count, recommendations, chosen provider, status, error, model type/version | user/date, criteria, status, model, candidate count, chosen provider |
| `provider_metrics` / `ProviderMetrics` | Historical provider metrics | provider, order counts, completion/cancel rates, ratings, response/arrival times, specialization/city/period metrics | provider unique, completion/rating/response/order indexes |
| `audit_logs` / `AuditLog` | Admin audit trail | admin identity, action, entity, summary, before/after, metadata, IP, user agent | admin/date, action/date, entity/date, createdAt |

### Database Usage Notes

- Object relationships are stored as MongoDB ObjectIds in schemas such as orders, reviews, subscriptions, vehicles, wallets, and transactions.
- Geospatial provider and order locations use `Point` coordinates in `[longitude, latitude]` order.
- Some application services use aggregation pipelines for analytics, provider enrichment, recommendations, wallet admin views, and rating calculations.
- Some repositories attempt MongoDB transactions and include fallback paths for non-replica-set local MongoDB.

---

## 7. Entity Relationship Documentation

Core relationships:

```text
User
  -> Vehicles
  -> Orders
  -> Wallet
  -> UserSubscriptions
  -> Reviews
  -> Notifications
  -> Chats as participant

Provider
  -> Services through services/requestedServices/servicePrices
  -> Orders
  -> Wallet
  -> Reviews
  -> ProviderMetrics

Order
  -> User
  -> Provider
  -> Service
  -> Vehicle
  -> Review
  -> StatusHistory records
  -> Chat
  -> Wallet transactions through references

SubscriptionPlan
  -> UserSubscriptions
  -> User activeSubscription and premium flags

Wallet
  -> Transactions
  -> Users, providers, or system owner

Notification
  -> User recipient or provider-resolved user recipient

Chat
  -> Order
  -> User/provider participants
  -> Messages
```

Ownership rules:

- A `User` owns vehicles, addresses, payment methods, wash plans, devices, and customer orders.
- A provider account is represented by a `User` with `accountType: provider` and a `Provider` profile matched primarily by phone.
- An order belongs to a customer user and may be assigned to one provider.
- Reviews are owned by the reviewing user and tied to a completed order.
- Provider ratings belong to the provider and are recalculated from visible reviews.
- Wallets are separate per owner and owner type: `user`, `provider`, or `system`.
- Admin users are stored in `admins`, not in `users`, and carry explicit permissions.

Lifecycle examples:

- Register provider: `PendingRegistration` -> `User` inactive -> placeholder `Provider` pending -> admin approves -> `User` active and `Provider` approved/active.
- Complete order: order status reaches `completed` -> status history saved -> provider earnings transferred -> review can be created -> rating recalculated.
- Subscribe user: active plan selected -> wallet charged when paid -> `UserSubscription` active -> user `isPremium` and `activeSubscription` updated.

---

## 8. Authentication and Authorization

### Roles

Role enum:

- `user`
- `provider`
- `admin`

User account types:

- `customer`
- `provider`
- `admin` exists as a schema enum value, but admin authentication uses the separate `Admin` schema and `AdminAuthService`.

Customer JWT payload normalizes `accountType: customer` to `role: user`, so `RolesGuard(Role.USER)` works.

### Guards

- `JwtAuthGuard`: global. Requires Bearer token unless route is decorated with `@Public()`.
- `MaintenanceGuard`: global. Blocks non-public routes when setting `app_config.maintenanceMode` is enabled, except admins.
- `RolesGuard`: route/controller level. Checks `@Roles(...)`.
- `PermissionsGuard`: route/controller level. Checks `@Permissions(...)`; `*` or `all` grants access.
- `WsJwtGuard`: WebSocket event guard.

### Customer and Provider Registration Flow

```text
POST /auth/register
  validate RegisterDto
  ensure phone is not already used
  hash password
  force accountType to customer unless exactly provider
  upsert PendingRegistration with 10-minute expiry
  generate OTP for pending record

POST /auth/verify-otp
  find PendingRegistration
  check max attempts, code, expiry
  create User
    customer -> isActive true
    provider -> isActive false
  if provider:
    create pending Provider placeholder
    notify first active admin
  delete PendingRegistration
  issue access and refresh tokens
```

Current OTP behavior in source:

- OTP is fixed to `123456` in `OtpService`.
- WhatsApp readiness and sending are commented as dev-mode bypass.
- OTP expiry is 5 minutes.
- Resend cooldown is effectively 2 minutes, implemented by checking whether more than 3 minutes remain from the 5-minute validity.
- Max OTP attempts: 3.

### Login Flow

`POST /auth/login`:

1. Find user by phone and include password.
2. Reject if not found.
3. Reject if not verified.
4. Reject if inactive.
5. Compare password with bcrypt.
6. Update `lastLoginAt`.
7. Create access and refresh tokens.
8. Hash and store refresh token in user document.

### Refresh Token Flow

`POST /auth/refresh-token`:

1. Verify refresh token with refresh secret.
2. Load user with stored `refreshToken`.
3. Compare raw refresh token against stored hash.
4. Issue a new token pair and replace stored refresh hash.

Admin refresh uses the same concept but reads from `admins`.

### Admin Authentication

Admin login:

- `POST /admin/login`
- Email/password.
- Checks active status.
- Returns admin info and tokens.
- Stores hashed refresh token in `Admin.refreshToken`.

Admin permissions:

The permission list includes:

`admin.profile`, `admins.*`, `analytics.read`, `audit.read`, `finance.*`, `notifications.*`, `orders.*`, `bookings.*`, `providers.*`, `reviews.*`, `services.*`, `subscriptions.*`, `settings.*`, `users.*`.

Admin management safeguards:

- Cannot remove own admin-management permission.
- Cannot deactivate own account.
- Cannot delete own account.
- At least one active admin manager must remain.

### Session Storage

The backend uses bearer JWTs. It does not set HttpOnly cookies in the analyzed implementation. Refresh tokens are stored server-side as bcrypt hashes on the `User` or `Admin` document.

---

## 9. API Documentation

### Global API Contract

Default prefix: `/api/v1`.

Successful responses are globally wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": "controller return value",
  "timestamp": "2026-06-20T00:00:00.000Z"
}
```

Some controllers already return objects like `{ "success": true, "data": ... }`. Because the global transform still wraps them, clients may receive an inner success object under `data`.

HTTP errors handled by `HttpExceptionFilter` return:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "error message",
  "errors": null,
  "timestamp": "ISO_DATE",
  "path": "/api/v1/..."
}
```

Common error cases:

- `400`: DTO validation failure, invalid ObjectId, invalid state transition, invalid business input.
- `401`: missing/invalid/expired token, invalid credentials, invalid refresh token.
- `403`: role/permission mismatch or ownership failure.
- `404`: entity not found.
- `409`: duplicate account or conflicting state.
- `503`: maintenance mode.

### Root and System

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/` | Public | None | Hello/service response | Basic app health-style response from `AppService`. |
| GET | `/system/schemas` | Admin role | None | Schema metadata | Exposes system schema metadata for admins. |

### Auth APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/auth/whatsapp/status` | Public | None | Boolean/status | Delegates to WhatsApp client readiness. |
| POST | `/auth/register` | Public, throttled | `RegisterDto` | OTP response | Creates pending registration and OTP. |
| POST | `/auth/verify-otp` | Public, throttled | `VerifyOtpDto` | user + access/refresh token | Creates verified user, provider placeholder if needed. |
| POST | `/auth/resend-otp` | Public, throttled | phone number body | OTP response | Regenerates OTP for pending registration with cooldown. |
| POST | `/auth/login` | Public, throttled | `LoginDto` | user + tokens | Password login for active verified user. |
| POST | `/auth/refresh-token` | Public, throttled | `RefreshTokenDto` | user + new tokens | Verifies refresh JWT and stored hash. |
| POST | `/auth/forgot-password` | Public, throttled | `ForgotPasswordDto` | OTP response | Generates reset OTP for existing user. |
| POST | `/auth/reset-password` | Public, throttled | `ResetPasswordDto` | message | Validates OTP and replaces password. |
| POST | `/auth/restore/request-otp` | Public, throttled | `RequestRestoreOtpDto` | OTP response | Sends OTP for inactive account restoration. |
| POST | `/auth/restore/confirm` | Public, throttled | `ConfirmRestoreOtpDto` | user + tokens | Reactivates inactive account after OTP. |
| GET | `/auth/me` | JWT | Bearer token | current user | Returns authenticated user payload/profile data. |
| POST | `/auth/logout` | JWT | Bearer token | message | Clears stored refresh token and records logout. |

Key validation:

- Phone must match Syrian `+963` mobile format in auth DTOs.
- Password min length 8 and requires uppercase and digit in registration/reset DTOs.
- Terms must be accepted during registration.
- OTP must be 6 digits.

### Admin APIs

All admin endpoints require JWT through the global guard except `login`, `refresh-token`, and `settings/public`. Most require `Role.ADMIN` and a permission.

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/admin/login` | Public | `AdminLoginDto` | admin + tokens | Admin email/password login. |
| POST | `/admin/refresh-token` | Public | refresh token | tokens | Admin refresh token rotation. |
| POST | `/admin/logout` | Admin `admin.profile` | token | message | Clears admin refresh token. |
| GET | `/admin/me` | Admin `admin.profile` | token | admin profile | Returns current admin data. |
| GET | `/admin/providers` | Admin `providers.read` | filters/page/limit | providers + facets | Aggregated provider list with search/status/city/service/rating filters. |
| GET | `/admin/providers/:id` | Admin `providers.read` | id | enriched provider | Provider detail with order/review computed fields. |
| PATCH | `/admin/providers/:id/approve` | Admin `providers.approve` | id | provider + message | Approves provider, activates provider user, sends notification. |
| PATCH | `/admin/providers/:id/reject` | Admin `providers.reject` | reason | provider + message | Rejects provider, deactivates user, stores rejection reason, sends notification. |
| PATCH | `/admin/providers/:id` | Admin `providers.update` | safe provider fields | provider + message | Updates allow-listed provider fields. |
| GET | `/admin/services` | Admin `services.read` | filters/page/limit | service list | Admin service search/list. |
| POST | `/admin/services` | Admin `services.create` | service DTO | service | Creates service. |
| PATCH | `/admin/services/:id` | Admin `services.update` | update DTO | service | Updates service. |
| DELETE | `/admin/services/:id` | Admin `services.delete` | id | result | Deletes or deactivates service according to service layer. |
| GET | `/admin/stats` | Admin `analytics.read` | none | general stats | Counts users/providers/orders and completed revenue. |
| GET | `/admin/stats/orders` | Admin `analytics.read` | none | status counts | Aggregates orders by status. |
| GET | `/admin/stats/revenue` | Admin `finance.read` | none | monthly revenue | Aggregates completed order revenue by month. |
| GET | `/admin/stats/top-services` | Admin `analytics.read` | none | top services | Aggregates order count and revenue per service. |
| GET | `/admin/stats/bookings-analytics` | Admin `analytics.read` | none | booking analytics | Scheduled order status, weekly trend, service breakdown. |
| GET | `/admin/stats/users-analytics` | Admin `analytics.read` | none | user analytics | Growth, loyalty, active/premium counts. |
| GET | `/admin/dashboard/summary` | Admin `analytics.read` | none | summary | Provider/user/order/revenue summary. |
| GET | `/admin/dashboard/excel-summary` | Admin `analytics.read` | none | large summary object | Provider data quality/KPI/category/city/working-hour insight summary. |
| GET | `/admin/dashboard/providers-by-governorate` | Admin `analytics.read` | none | aggregation rows | Providers grouped by governorate. |
| GET | `/admin/dashboard/providers-by-service` | Admin `analytics.read` | none | aggregation rows | Providers grouped by category. |
| GET | `/admin/dashboard/providers-growth` | Admin `analytics.read` | none | monthly counts | Provider growth by month. |
| GET | `/admin/dashboard/top-cities` | Admin `analytics.read` | none | top cities | Provider count by city. |
| GET | `/admin/dashboard/map/syria-providers` | Admin `analytics.read` | none | provider map points | Providers with stored coordinates. |
| GET | `/admin/memberships` | Admin `subscriptions.read` | query | plans | Legacy membership alias for subscription plans. |
| GET | `/admin/subscription-plans` | Admin `subscriptions.read` | query | plans | Canonical plan list. |
| POST | `/admin/memberships` | Admin `subscriptions.create` | create membership plan DTO | plan | Legacy create alias. |
| POST | `/admin/subscription-plans` | Admin `subscriptions.create` | create plan DTO | plan | Creates subscription plan. |
| PATCH | `/admin/memberships/:id` | Admin `subscriptions.update` | update DTO | plan | Legacy update alias. |
| PATCH | `/admin/subscription-plans/:id` | Admin `subscriptions.update` | update DTO | plan | Updates subscription plan. |
| DELETE | `/admin/memberships/:id` | Admin `subscriptions.delete` | id | result | Legacy delete alias. |
| DELETE | `/admin/subscription-plans/:id` | Admin `subscriptions.delete` | id | result | Deletes/deactivates plan. |
| GET | `/admin/memberships/subscribers` | Admin `subscriptions.read` | query | subscribers | Subscription subscriber list. |
| GET | `/admin/memberships/stats` | Admin `subscriptions.read` | none | stats | Membership stats. |
| GET | `/admin/subscriptions` | Admin `subscriptions.read` | query | subscriptions | Admin subscription list. |
| GET | `/admin/settings/public` | Public | none | public settings | App name/version/contact/default currency. |
| GET | `/admin/settings` | Admin `settings.read` | none | settings | Full app settings. |
| PATCH | `/admin/settings` | Admin `settings.update` | `UpdateAppSettingsDto` | settings | Updates commission, withdrawal minimum, currency, contact data. |
| PATCH | `/admin/settings/maintenance` | Admin `settings.update` | `UpdateMaintenanceDto` | settings | Updates maintenance mode/messages. |
| GET | `/admin/list` | Admin `admins.read` | filters | admins + stats | Lists admin accounts. |
| POST | `/admin/create` | Admin `admins.create` | `CreateAdminDto` | admin | Creates admin with permissions. |
| PATCH | `/admin/:id/permissions` | Admin `admins.update` | permissions | admin | Updates permissions with self/manager safeguards. |
| PATCH | `/admin/:id/status` | Admin `admins.update` | `isActive` | admin | Activates/deactivates admin with safeguards. |
| PATCH | `/admin/:id/password` | Admin `admins.update` | password | message | Resets another admin password. |
| DELETE | `/admin/:id` | Admin `admins.delete` | id | message | Deletes admin with safeguards. |

### Users APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/users/me` | JWT | token | user profile | Returns current user. |
| PATCH | `/users/me` | JWT | `UpdateUserDto` | updated user | Updates profile/preferences; notification preferences must be booleans. |
| DELETE | `/users/me` | JWT | token | message | Deletes/deactivates current account. |
| GET | `/users/me/stats` | JWT | token | profile stats object | Returns current placeholder stats from user use case. |
| GET | `/admin/users` | Admin `users.read` | filters/page | users | Admin user list. |
| GET | `/admin/users/search` | Admin `users.read` | search query | users | Admin user search. |
| GET | `/admin/users/:id` | Admin `users.read` | id | user details | Admin user detail. |
| PATCH | `/admin/users/:id/status` | Admin `users.status` | status/body | user | Admin toggles user active/status. |
| PATCH | `/admin/users/:id` | Admin `users.update` | update body | user | Admin updates user. |
| DELETE | `/admin/users/:id` | Admin `users.delete` | id | result | Admin deletes/deactivates user. |

### Provider APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/providers/apply` | Public | `CreateProviderDto` | provider | Creates/updates pending provider application. |
| GET | `/providers` | Public | `ProviderQueryDto` | paginated providers | Public provider list. |
| GET | `/providers/nearby` | Public | `NearbyProviderDto` | nearby providers | Geospatial search with distance constraints. |
| GET | `/providers/top-rated` | Public | query | providers | Top rated provider list. |
| GET | `/providers/public/governorates` | Public | none | governorate list | Distinct/aggregated provider governorates. |
| GET | `/providers/public/statistics` | Public | none | public stats | Counts customers/providers/governorates and average response minutes. |
| GET | `/providers/:id` | Public | id | provider | Public provider details. |
| GET | `/providers/me` | Provider | token | provider | Finds provider by phone from JWT. |
| PUT | `/providers/me` | Provider | profile DTO | provider | Updates provider profile. |
| PUT | `/providers/me/location` | Provider | longitude/latitude | provider | Updates provider profile location. |
| PUT | `/providers/me/status` | Provider | status DTO | provider | Updates runtime provider status if approved/active. |
| PUT | `/providers/me/services` | Provider | `UpdateProviderServicesDto` | provider | Validates active services, prices, availability, categories. |
| PUT | `/providers/me/working-hours` | Provider | `UpdateProviderWorkingHoursDto` | provider | Requires all 7 weekdays, close after open unless closed. |
| PUT | `/providers/me/documents` | Provider | document URLs | provider | Updates document list. |
| POST | `/providers/me/documents/upload` | Provider | multipart file | file URL | Uploads PDF/JPG/PNG up to 5MB to provider documents folder. |
| PUT | `/providers/me/bank-account` | Provider | bank account DTO | provider | Stores provider bank account. |
| GET | `/providers/dashboard/all-stats` | Provider | token | stats | Full provider dashboard stats. |
| GET | `/providers/dashboard/summary` | Provider | token | summary | Provider dashboard summary. |
| GET | `/providers/dashboard/orders-stats` | Provider | token | order stats | Provider order analytics. |
| GET | `/providers/dashboard/revenue-stats` | Provider | token | revenue stats | Provider revenue analytics. |
| GET | `/providers/dashboard/services-performance` | Provider | token | service performance | Provider service analytics. |
| GET | `/providers/admin/stats` | Admin `providers.read` | none | stats | Provider admin stats. |
| POST | `/providers/admin` | Admin `providers.create` | `CreateProviderDto` | provider | Admin creates provider. |
| GET | `/providers/admin/:id` | Admin `providers.read` | id | provider | Admin provider detail. |
| PATCH | `/providers/admin/:id` | Admin `providers.update` | update DTO | provider | Admin updates provider. |
| PATCH | `/providers/admin/:id/status` | Admin `providers.status` | status body | provider | Admin active/status update. |
| PATCH | `/providers/admin/:id/reject` | Admin `providers.reject` | reason | provider | Admin rejection. |
| DELETE | `/providers/admin/:id` | Admin `providers.delete` | id | result | Admin provider delete/deactivate. |
| POST | `/providers/:id/approve` | Admin `providers.approve` | id | provider | Alternative approve endpoint. |

Provider DTO highlights:

- Coordinates must be valid longitude/latitude.
- Service list supports both canonical service IDs and legacy `services_list`.
- Service prices must belong to selected services and be non-negative.
- Service availability values must be booleans.
- Working hours must contain each weekday exactly once.

### Services APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/services` | Public | `ListServicesQueryDto` | services | Public active service list with filters. |
| GET | `/services/categories` | Public | none | categories | Service category inventory. |
| GET | `/services/emergency` | Public | none | emergency services | Active emergency services. |
| GET | `/services/search` | Public | search query | services | Public service search. |
| GET | `/services/:id` | Public | id | service | Service details. |
| GET | `/services/admin/list` | Admin `services.read` | filters/page | services | Admin service list. |
| GET | `/services/admin/stats` | Admin `services.read` | none | stats | Service stats. |
| GET | `/services/admin/:id` | Admin `services.read` | id | service | Admin service detail. |
| POST | `/services/admin` | Admin `services.create` | `CreateServiceDto` | service | Creates service. |
| PATCH | `/services/admin/:id` | Admin `services.update` | `UpdateServiceDto` | service | Updates service. |
| PATCH | `/services/admin/:id/status` | Admin `services.update` | active/status body | service | Updates active status. |
| DELETE | `/services/admin/:id` | Admin `services.delete` | id | result | Deletes/deactivates service. |

### Orders and Bookings APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/orders` | JWT | `CreateOrderDto` | order | Creates immediate order. |
| POST | `/bookings` | JWT | `CreateOrderDto` with `scheduleTime` | scheduled order | Creates scheduled booking; rejects missing schedule time. |
| GET | `/orders` | JWT | filters/page/sort | orders | Lists orders scoped by role: admin all, provider own, user own. |
| GET | `/bookings` | JWT | filters/page/sort | bookings | Same list behavior but `isScheduled: true`. |
| GET | `/bookings/:id` | JWT | id | booking | Gets scheduled order only. |
| GET | `/orders/search` | JWT | search filters | orders | Search orders. |
| GET | `/orders/report` | JWT | filters | report | Order report data. |
| GET | `/orders/stats` | JWT | filters | stats | Order statistics. |
| GET | `/orders/:id/status-transitions` | JWT | id | allowed transitions | Current status, allowed next statuses, terminal flag. |
| GET | `/orders/:id` | JWT | id | order | Detail with ownership enforcement in use case. |
| GET | `/orders/:id/status-history` | JWT | id | history | Order status history. |
| GET | `/orders/:id/tracking` | JWT | id | tracking | Order/provider tracking info. |
| PATCH | `/orders/:id/status` | JWT | status body | order | State-machine transition. |
| PATCH | `/orders/:id` | JWT | update body | order | General update route. |
| PATCH | `/orders/:id/location` | JWT | `UpdateLocationDto` | order | Provider location update and event emission. |
| POST | `/orders/:id/payment/verify` | JWT | `VerifyPaymentDto` | order/result | Verifies payment status. |
| POST | `/orders/:id/cancel` | JWT | `CancelOrderDto` | order | Cancels order, refunds wallet/points if needed. |
| POST | `/orders/:id/customer-confirm-completion` | JWT user | id | order | Customer confirms provider requested completion. |
| POST | `/orders/:id/review` | JWT | `ReviewOrderDto` | review/order result | Creates simple order review path. |
| DELETE | `/orders/:id` | JWT | id | result | Deletes/cancels according to controller/use case. |

Create order validation:

- `serviceId` is required.
- Optional `providerId`, `vehicleId`, `scheduleTime`, notes.
- `location.coordinates` are `[longitude, latitude]`.
- If provider is specified, provider must exist and offer the requested service.
- If scheduled with provider, availability is checked.

### Reviews APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/reviews` | Admin `reviews.read` | filters/page | reviews | Admin/global review list. |
| GET | `/reviews/stats` | Admin `reviews.read` | filters | stats | Review statistics. |
| POST | `/reviews` | JWT | review DTO | review | Creates review for completed order. |
| GET | `/reviews/provider/:providerId` | JWT | providerId/page | reviews | Provider review list. |
| PATCH | `/reviews/:id/respond` | JWT | response | review | Provider/admin responds to review. |
| PATCH | `/reviews/:id` | Admin `reviews.update` | update body | review | Admin review update/moderation. |
| DELETE | `/reviews/:id` | JWT | id | result | User owner or admin deletes review. |

Review creation rules:

- `orderId` is required.
- Only order owner or admin may review.
- Order must be `completed`.
- Only one review per order.
- Order must have a provider.
- Rating stats are recalculated after create/delete.

### Wallet APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/wallet/me` | User | token | wallet | Gets or creates current user wallet. |
| POST | `/wallet/deposit` | User | `DepositDto` | error/result | Direct deposits are disabled in use case; use payments initialize. |
| GET | `/wallet/transactions` | User | filters/page | transactions | User wallet transactions. |
| POST | `/wallet/redeem-points` | User | `RedeemPointsDto` | redemption result | Converts loyalty points to order discount or balance logic. |
| GET | `/provider/wallet/me` | Provider | token | wallet | Gets provider wallet. |
| POST | `/provider/wallet/withdraw` | Provider | `WithdrawDto` | transaction | Creates pending withdraw transaction. |
| POST | `/provider/wallet/payout` | Provider | payout body | pending payout | Deducts balance and creates pending payout. |
| GET | `/provider/wallet/transactions` | Provider | filters/page | transactions | Provider wallet transactions. |
| GET | `/provider/wallet/transactions/export` | Provider | filters | export | Exports provider transactions. |
| GET | `/admin/wallet/stats` | Admin `finance.read` | none | stats | Wallet financial stats. |
| GET | `/admin/wallet/transactions/all` | Admin `finance.read` | filters/page | transactions | All wallet transactions. |
| PATCH | `/admin/wallet/payouts/:id` | Admin `finance.update` | process payout body | transaction | Approves/completes/rejects payout. |
| GET | `/admin/wallet/platform` | Admin `finance.read` | none | wallet | Platform wallet. |
| GET | `/admin/wallet/platform/transactions` | Admin `finance.read` | filters/page | transactions | Platform wallet transactions. |
| GET | `/admin/wallet/:ownerId` | Admin `finance.read` | ownerId/type | wallet | Owner wallet. |
| GET | `/admin/wallet/:ownerId/transactions` | Admin `finance.read` | filters/page | transactions | Owner transactions. |
| POST | `/admin/wallet/:ownerId/adjust` | Admin `finance.update` | adjustment body | transaction | Manual admin adjustment. |

### Subscription APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/subscriptions/plans` | Public | query | plans | Lists active plans. |
| GET | `/subscriptions/plans/:id` | Public | id | plan | Gets active plan by ID. |
| POST | `/subscriptions/subscribe` | JWT | `SubscribeDto` | subscription | Creates active subscription, charges wallet if price > 0. |
| POST | `/subscriptions/renew` | JWT | subscription/plan body | subscription | Extends active subscription and charges wallet. |
| POST | `/subscriptions/upgrade` | JWT | new plan body | subscription | Cancels old subscription and creates new one after charging. |
| POST | `/subscriptions/cancel` | JWT | `CancelSubscriptionDto` | subscription | Cancels immediately or disables auto-renew. |
| GET | `/subscriptions/status` | JWT | token | status | Current subscription state. |
| GET | `/subscriptions/history` | JWT | query | history | User subscription history. |
| GET | `/subscriptions/admin/subscriptions` | Admin `subscriptions.read` | filters | subscriptions | Admin list. |
| GET | `/subscriptions/admin/stats` | Admin `subscriptions.read` | none | stats | Admin subscription stats. |
| POST | `/subscriptions/admin/plans` | Admin `subscriptions.create` | create plan DTO | plan | Creates plan. |
| PATCH | `/subscriptions/admin/plans/:id` | Admin `subscriptions.update` | update DTO | plan | Updates plan. |
| DELETE | `/subscriptions/admin/plans/:id` | Admin `subscriptions.delete` | id | result | Deletes/deactivates plan. |

### Notifications APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/notifications` | JWT | page/limit | notifications | Current user notifications. |
| POST | `/notifications/admin/broadcast` | Admin `notifications.create` | audience/title/body/type/scheduledAt | campaign | Creates immediate or scheduled broadcast. |
| GET | `/notifications/admin/history` | Admin `notifications.read` | filters/page | campaigns | Campaign history. |
| GET | `/notifications/admin/stats` | Admin `notifications.read` | none | stats | Notification totals/campaigns. |
| GET | `/notifications/unread-count` | JWT | token | count | Current unread count. |
| PATCH | `/notifications/:id/read` | JWT | id | notification | Marks notification as read if it belongs to user. |
| PATCH | `/notifications/read-all` | JWT | token | message | Marks all current user notifications as read. |

### Chat APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/chat/conversations` | JWT | `CreateChatDto` | chat | Creates/gets order chat after participant validation. |
| GET | `/chat/conversations` | JWT | token | chats | Lists user active chats. |
| GET | `/chat/:chatId/messages` | JWT | page/limit | messages + total | Lists messages after membership check. |
| POST | `/chat/upload` | JWT | multipart file | fileUrl | Uploads jpg/jpeg/png/gif/pdf/doc/docx up to 5MB. |

### Customer Experience APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/customer/addresses` | JWT | token | addresses | Lists user addresses, default first. |
| POST | `/customer/addresses` | JWT | `CreateAddressDto` | address | Creates address, first/default logic. |
| PATCH | `/customer/addresses/:id` | JWT | `UpdateAddressDto` | address | Updates owned address. |
| DELETE | `/customer/addresses/:id` | JWT | id | result | Deletes owned address and reassigns default if needed. |
| PATCH | `/customer/addresses/:id/set-default` | JWT | id | address | Makes address default. |
| GET | `/customer/payment-methods` | JWT | token | payment methods | Lists saved methods. |
| POST | `/customer/payment-methods` | JWT | `CreatePaymentMethodDto` | method | Creates method; card requires brand, last4, providerToken. |
| PATCH | `/customer/payment-methods/:id` | JWT | update DTO | method | Updates owned method. |
| DELETE | `/customer/payment-methods/:id` | JWT | id | result | Deletes method; cash cannot be deleted. |
| PATCH | `/customer/payment-methods/:id/set-default` | JWT | id | method | Makes method default. |
| GET | `/customer/offers` | JWT | none | active offers | Lists active offers in date range. |
| POST | `/customer/offers/:id/apply` | JWT | `ApplyOfferDto` | redemption/order result | Reserves or applies offer to pending order. |
| GET | `/customer/wash-plans` | JWT | token | wash plans | Lists recurring wash plans. |
| POST | `/customer/wash-plans` | JWT | `CreateWashPlanDto` | plan | Creates plan after vehicle/address ownership checks. |
| PATCH | `/customer/wash-plans/:id` | JWT | update DTO | plan | Updates owned plan. |
| DELETE | `/customer/wash-plans/:id` | JWT | id | result | Deletes owned plan. |
| POST | `/customer/wash-plans/:id/generate-booking` | JWT | id | order | Generates scheduled car wash booking. |
| POST | `/customer/devices` | JWT | `RegisterDeviceDto` | device | Registers FCM token and updates user `fcmToken`. |
| DELETE | `/customer/devices/:token` | JWT | token | result | Deactivates device and unsets matching user token. |

Admin offer endpoints:

- `GET /admin/offers`
- `POST /admin/offers`
- `PATCH /admin/offers/:id`
- `DELETE /admin/offers/:id`

These are protected by admin JWT/role guard in `AdminOffersController`.

### Vehicles APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/vehicles` | JWT | `CreateVehicleDto` | vehicle | Creates user vehicle; max 10; first is default. |
| GET | `/vehicles/my` | JWT | query | vehicles | Lists current user vehicles. |
| GET | `/vehicles/search` | JWT | query/page/limit | vehicles | Requires search query length at least 2. |
| GET | `/vehicles/:id` | JWT | id | vehicle | Gets owned vehicle. |
| PATCH | `/vehicles/:id` | JWT | `UpdateVehicleDto` | vehicle | Updates owned vehicle. |
| DELETE | `/vehicles/:id` | JWT | id | result | Deletes owned vehicle; cannot delete only default. |
| PATCH | `/vehicles/:id/set-default` | JWT | id | vehicle | Sets default and unsets others. |
| POST | `/vehicles/:id/maintenance` | JWT | `CreateMaintenanceRecordDto` | record | Adds record for owned vehicle. |
| GET | `/vehicles/:id/maintenance` | JWT | query | records | Lists maintenance records for owned vehicle. |
| PATCH | `/vehicles/maintenance/:id` | JWT | update DTO | record | Updates owned maintenance record. |
| DELETE | `/vehicles/maintenance/:id` | JWT | id | result | Deletes owned maintenance record. |
| POST | `/vehicles/:id/reminders` | JWT | `CreateVehicleReminderDto` | reminder | Creates reminder; requires date or mileage; max 20. |
| GET | `/vehicles/:id/reminders` | JWT | query | reminders | Lists owned vehicle reminders. |
| DELETE | `/vehicles/reminders/:id` | JWT | id | result | Deletes owned reminder. |
| GET | `/admin/vehicles` | Admin `vehicles.read` | filters/page | vehicles | Admin vehicle list. |
| GET | `/admin/vehicles/stats` | Admin `vehicles.read` | none | stats | Vehicle stats. |
| GET | `/admin/vehicles/top-models` | Admin `vehicles.read` | none | models | Top vehicle models. |
| GET | `/admin/vehicles/distribution` | Admin `vehicles.read` | none | distribution | Vehicle distribution. |
| GET | `/admin/vehicles/year-stats` | Admin `vehicles.read` | none | year stats | Vehicle counts by year. |
| GET | `/admin/vehicles/:id` | Admin `vehicles.read` | id | vehicle | Admin vehicle details. |
| DELETE | `/admin/vehicles/:id` | Admin `vehicles.delete` | id | result | Admin vehicle delete. |
| GET | `/admin/vehicles/user/:userId` | Admin `vehicles.read` | userId | vehicles | User vehicles for admin. |

### Payments APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/payments/initialize` | JWT | `InitializePaymentDto` | paymentIntentId/referenceId/gatewayUrl | Creates mock Cham Cash payment intent. |
| POST | `/payments/webhook/cham-cash` | Public webhook | payload + `x-chamcash-signature` | received/result | Verifies signature and fulfills wallet top-up. |
| GET | `/mock-cham-cash/checkout/:referenceId` | Public | referenceId, amount query | HTML | Renders mock checkout page. |
| POST | `/mock-cham-cash/process/:referenceId` | Public | form body | HTML success | Creates success payload and calls webhook asynchronously. |

### AI Recommendation APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| POST | `/ai/recommend-provider` | JWT | `RecommendProviderDto` | recommendations | Rule/ML provider recommendation, logs result. |
| GET | `/admin/ai-recommendations/summary` | Admin `analytics.read` | filters | summary | Recommendation log analytics. |
| GET | `/admin/ai-recommendations/top-providers` | Admin `analytics.read` | filters/limit | top providers | Aggregates recommended providers. |
| GET | `/admin/ai-recommendations/service-performance` | Admin `analytics.read` | filters | service performance | Grouped recommendation performance by service. |
| GET | `/admin/ai-recommendations/city-performance` | Admin `analytics.read` | filters | city performance | Grouped recommendation performance by city. |
| GET | `/admin/ai-recommendations/filters` | Admin `analytics.read` | none | filter lists | Distinct cities/categories/models/statuses. |
| GET | `/admin/ai-recommendations/logs` | Admin `analytics.read` | filters/page | logs | Paginated recommendation logs. |
| GET | `/admin/ai-recommendations/export` | Admin `analytics.read` | filters | CSV | Exports up to 5000 logs. |
| POST | `/admin/ai-recommendations/retrain` | Admin `analytics.read` | body | result | Triggers model retraining service. |

### Audit APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/audit-logs` | Admin `audit.read` | filters/page | logs | Admin audit log list. |
| GET | `/admin/audit-logs/stats` | Admin `audit.read` | filters | stats | Audit log stats. |
| GET | `/admin/audit-logs/export` | Admin `audit.read` | filters | export | Audit export. |
| GET | `/admin/audit-logs/entity/:entityType/:entityId` | Admin `audit.read` | entity | logs | Entity-specific audit history. |

### WhatsApp APIs

| Method | Path | Auth | Input | Response | Business Logic |
| --- | --- | --- | --- | --- | --- |
| GET | `/whatsapp/login` | Admin | optional password/query | QR/login page | Starts/returns WhatsApp login page. |
| GET | `/whatsapp/qr` | Admin | none | QR/status | Returns QR info. |
| GET | `/whatsapp/status` | Admin | none | status | WhatsApp client status. |
| POST | `/whatsapp/send-message` | Admin | phone/message/password | result | Sends WhatsApp message if ready. |
| POST | `/whatsapp/restart` | Admin | password | result | Restarts WhatsApp client. |

### WebSocket Events

Namespace `/ws`:

| Event | Auth | Payload | Behavior |
| --- | --- | --- | --- |
| `join:order` | WS JWT | `orderId` | Validates access to order and joins `order:<id>`. |
| `leave:order` | WS JWT | `orderId` | Leaves order room. |
| `join:chat` | Not guarded in `AppGateway` | `chatId` | Joins `chat:<id>` room. |
| `leave:chat` | Not guarded in `AppGateway` | `chatId` | Leaves chat room. |
| `update:order:status` | WS JWT | `orderId`, `status`, `note` | Updates order status via use case and emits `order:status:updated`. |
| `update:order:location` | WS JWT | location data | Updates provider order location. |
| `send:message` | Not guarded in `AppGateway` | chat message | Broadcasts lightweight `message:new`; persistence is in `/chat` namespace. |
| `start:typing` / `stop:typing` | Not guarded in `AppGateway` | chatId/userId | Broadcasts typing events. |
| `update:provider:location` | WS JWT | providerId/lat/lng | Updates provider profile location with admin/provider authorization. |

Namespace `/chat`:

| Event | Auth | Payload | Behavior |
| --- | --- | --- | --- |
| `join_chat` | WS JWT | `chatId` | Verifies chat membership, joins room, emits online. |
| `leave_chat` | WS JWT | `chatId` | Leaves chat room. |
| `send_message` | WS JWT | `SendMessageDto` | Persists message and emits `new_message`. |
| `typing` | WS JWT | chatId/isTyping | Verifies membership and emits typing state. |
| `message_read` | WS JWT | `chatId` | Marks messages read and emits read event. |

Namespace `notifications`:

| Event | Auth | Payload | Behavior |
| --- | --- | --- | --- |
| `join_notifications` | WS JWT | none | Joins `user_<id>` notification room. |

---

## 10. Provider Registration Workflow

There are two provider entry paths.

### Path A: Auth Registration as Provider

1. Client calls `POST /auth/register` with `accountType: provider`.
2. Backend hashes password and stores `PendingRegistration`.
3. OTP is generated for the pending registration.
4. Client calls `POST /auth/verify-otp`.
5. Backend creates `User`:
   - `accountType: provider`
   - `isVerified: true`
   - `isActive: false`
6. Backend creates `Provider` placeholder:
   - `phone` from user phone.
   - `businessName` and `ownerName` from full name.
   - `location` as `[0, 0]`.
   - `registrationStatus: pending`.
   - `isApproved: false`.
   - `isActive: false`.
7. Backend sends admin notification when an active admin exists.
8. Admin must approve provider before account becomes active.

### Path B: Public Provider Application

1. Client calls `POST /providers/apply` with `CreateProviderDto`.
2. `ManageProvidersUseCase.create` validates coordinates.
3. If phone already exists, provider is updated.
4. Otherwise provider is created.
5. Incoming fields are normalized:
   - `category` defaults from `businessType`.
   - `accountStatus` becomes `active` if approved else `pending`.
   - `is_emergency` and `emergency247` are synchronized.
   - `requestedServices` can be derived from `services_list`.
   - `servicePrices` can be derived from `services_list`.
   - `location` is built from longitude/latitude.
   - approval defaults to pending/not approved.

### Provider Enrichment After Account Creation

Provider dashboard endpoints allow the provider to complete:

- Basic profile: business name, owner name, description, email, address, city.
- Location: longitude, latitude.
- Runtime status: online/offline/busy.
- Services: active service IDs, service categories, prices, availability.
- Working hours: exactly seven weekdays, with valid opening/closing times.
- Documents: uploaded or referenced document files.
- Bank account: bank account object for payouts.

### Admin Approval

Admin approval endpoints set:

- `registrationStatus: approved`
- `accountStatus: active`
- `isApproved: true`
- `isActive: true`
- `isVerified: true` on provider record in admin service
- matching provider `User.isActive: true`

Admin rejection sets:

- `registrationStatus: rejected`
- `accountStatus: suspended`
- `isApproved: false`
- `isActive: false`
- `rejectionReason`
- matching provider user inactive

---

## 11. Orders System

### Order Statuses

`OrderStatus`:

- `pending`
- `accepted`
- `provider_assigned`
- `provider_en_route`
- `provider_arrived`
- `in_progress`
- `awaiting_customer_confirmation`
- `completed`
- `cancelled`
- `rejected`

Terminal statuses:

- `completed`
- `cancelled`
- `rejected`

### State Machine

Allowed transitions:

```text
pending -> accepted, provider_assigned, cancelled, rejected
accepted -> provider_en_route, provider_arrived, in_progress, cancelled, rejected
provider_assigned -> provider_en_route, provider_arrived, in_progress, cancelled, rejected
provider_en_route -> provider_arrived, in_progress, cancelled
provider_arrived -> in_progress, cancelled
in_progress -> awaiting_customer_confirmation, completed
awaiting_customer_confirmation -> completed
completed -> none
cancelled -> none
rejected -> none
```

Provider allowed target statuses:

- `accepted`
- `provider_en_route`
- `provider_arrived`
- `in_progress`
- `awaiting_customer_confirmation`
- `completed`
- `cancelled`

Regular user direct status transitions are restricted. Customer completion confirmation uses a special actor role path.

### Order Creation

`CreateOrderUseCase`:

1. Loads requested service.
2. If provider selected:
   - provider must exist.
   - provider must offer service.
   - `serviceAvailability[serviceId]` must not be `false`.
3. If scheduled with provider:
   - scheduling availability is checked against estimated service duration.
4. Creates order with:
   - generated order number.
   - authenticated user.
   - service/provider/vehicle.
   - `status: pending`.
   - price from provider-specific price if available, otherwise service discounted/base price.
   - location and optional schedule metadata.
5. Records initial status history.
6. Notifies provider if assigned.

### Booking Creation

`POST /bookings` uses the same create order use case but requires `scheduleTime` and stores:

- `isScheduled: true`
- `scheduledAt`
- scheduled duration metadata.

### Status Updates

`UpdateOrderStatusUseCase`:

- Requires existing order.
- Provider can update only assigned orders; admin can update any.
- Calls state machine validation.
- Sets timestamps:
  - `acceptedAt` for accepted/provider assigned.
  - `startedAt` for in progress.
  - `completionRequestedAt` for awaiting customer confirmation.
  - `completedAt` for completed.
  - `cancelledAt`, `cancellationReason`, `cancelledBy` for cancelled/rejected.
- Records status history.
- On completed, transfers provider earnings if provider and total amount exist.
- Clears order cache and emits order status event.

### Cancellation

`CancelOrderUseCase`:

- Allows owner, assigned provider, admin, or system.
- Rejects cancellation for terminal orders.
- Sets cancellation fields.
- Records status history.
- If payment is completed and amount exists:
  - refunds user wallet.
  - sets payment status to refunded.
- If loyalty points were redeemed:
  - restores points.
  - creates loyalty point transaction.
- Clears cache and emits events.

### Customer Completion Confirmation

`ConfirmOrderCompletionUseCase`:

- Only the order owner can confirm.
- Moves from `awaiting_customer_confirmation` to `completed`.
- Sets `completedAt` and `customerConfirmedAt`.
- Transfers provider earnings.
- Records status history and emits event.

---

## 12. Subscription System

### Data Model

- `SubscriptionPlan`: plan catalog with localized names/descriptions, price, duration days, tier, features, active flag.
- `UserSubscription`: concrete user subscription with start/end, status, auto-renew, amount paid, cancellation data.
- `User`: stores `isPremium`, `premiumExpiresAt`, and `activeSubscription`.

### Subscribe

`SubscribeUserUseCase`:

1. Loads active plan.
2. Rejects if user already has an active subscription.
3. If plan price is greater than zero:
   - loads user wallet.
   - requires sufficient balance.
   - creates subscription fee transaction.
4. Creates active subscription from now to `durationDays`.
5. Sets auto-renew default.
6. Synchronizes user premium state.

### Renew

`RenewSubscriptionUseCase`:

- Requires active subscription.
- Requires active plan.
- Charges plan price if needed.
- Extends from current future end date or from now.
- Increments amount paid.
- Syncs premium state.

### Upgrade

`UpgradeSubscriptionUseCase`:

- Requires active subscription.
- Rejects upgrade to the same plan.
- Requires target active plan.
- Charges full target plan price.
- Cancels current subscription with replacement metadata.
- Creates a new active subscription for full target duration.
- Syncs premium state.

### Cancel

`CancelSubscriptionUseCase`:

- Requires active subscription.
- Sets `autoRenew: false`.
- If `cancelImmediately`:
  - marks status cancelled.
  - sets cancelledAt and endDate to now.
  - clears premium state.
- Otherwise subscription remains active until endDate.

### Status

`CheckSubscriptionStatusUseCase` returns either inactive state or active subscription details including expiration and days left.

---

## 13. Wallet and Financial System

### Wallet Types

`ownerType` can be:

- `user`
- `provider`
- `system`

Wallet fields:

- `balance`
- `pendingBalance`
- `loyaltyPoints`
- `currency`
- `isActive`

### Transaction Types

`TransactionType`:

- `credit`
- `debit`
- `refund`
- `loyalty_points`
- `subscription_fee`

### Direct Deposit

`DepositUseCase` exists but direct wallet deposit is disabled. It throws and instructs callers to use `/api/payments/initialize`.

### Provider Withdrawals and Payouts

- `WithdrawUseCase`: deducts provider balance and creates pending debit transaction with bank metadata.
- `RequestPayoutUseCase`:
  - provider wallet must exist.
  - wallet balance must cover amount.
  - amount must be at least setting `min_withdrawal_amount`.
  - deducts balance.
  - creates pending payout transaction.
- `ProcessPayoutUseCase`:
  - only pending payout transactions are processed.
  - completion marks payout completed.
  - rejection credits amount back and creates reversal transaction, then marks original failed.

### Provider Earnings

`TransferEarningsUseCase`:

- Reads commission from setting `commission_rate`, default `0.1`.
- Reads currency from setting `default_currency`, default `SYP`.
- Formula:

```text
commission = grossAmount * commissionRate
netAmount = grossAmount - commission
```

- Credits provider wallet with net amount.
- Credits platform/system wallet with commission amount.
- References the completed order.

Implementation note: duplicate checking searches for transaction type `deposit`, while persisted transaction types are enum values such as `credit`. This should be reviewed because it may weaken duplicate prevention.

### Loyalty Points

`RedeemLoyaltyPointsUseCase`:

- Point value: `0.05`.
- Points must be positive whole numbers.
- If redeeming against an order:
  - order must belong to user.
  - payment must be pending.
  - order must not be completed/cancelled/rejected.
  - duplicate redemption for same order is blocked with a partial unique index and service checks.
  - discount is `min(points * 0.05, order.payableAmount)`.
  - decrements wallet points.
  - updates order `discountAmount`, `payableAmount`, and metadata.
  - creates `loyalty_points` transaction.
- On failure, wallet/order updates are rolled back manually.

---

## 14. Reviews and Ratings System

Review creation rules:

- `orderId` required.
- Order must exist.
- Caller must be order owner or admin.
- Order status must be `completed`.
- One review per order.
- Order must have provider.

Review fields:

- main `rating`
- `comment`
- `serviceQuality`
- `punctuality`
- `professionalism`
- `valueForMoney`
- images
- provider response fields
- moderation/reporting fields

Rating calculation:

- Repository aggregates visible provider reviews.
- Average rating is rounded to one decimal.
- Total visible review count is calculated.
- `RecalculateProviderRatingUseCase` updates provider `averageRating` and `totalReviews`.

Provider responses:

- Provider can respond only if `review.provider` equals `currentUser.providerId`.
- Admin can also respond.
- Response is stored in `providerResponse` with `providerRespondedAt`.

Deleting reviews:

- User owner or admin can delete.
- Provider rating is recalculated after deletion.

AI integration:

- Review creation emits `review.created` with provider ID so AI/provider metrics can be recalculated.

---

## 15. Notifications System

### Notification Creation

`NotificationsService.createNotification`:

1. Resolves recipient.
2. Creates notification document.
3. If recipient push preference is enabled:
   - emits Socket.IO `notification` to room `user_<id>`.
   - sends FCM if `fcmToken` exists and Firebase Admin is initialized.
4. Recalculates unread count.
5. Emits `unread_count`.

### Recipient Resolution

- Non-provider recipient: loaded from `users` collection.
- Provider recipient: resolves provider by ID, then maps provider phone to provider user.

### Broadcasts

Admin broadcast supports audiences:

- `all`
- `users`
- `premium`
- `providers`

Broadcast rules:

- Audience must be valid.
- Title/body required.
- Notification type must be valid enum value.
- Creates a campaign ID.
- Can be immediate or scheduled.
- Bulk inserts notifications in chunks.
- Immediate broadcasts deliver realtime and optional FCM in chunks.

### Scheduled Dispatch

- A timer runs every 60 seconds.
- It finds notifications with `deliveryStatus: scheduled` and `scheduledAt <= now`.
- Marks them sent and emits to connected recipients.

### Read State

- Users can list notifications.
- Users can mark a notification as read only if it belongs to them.
- Users can mark all notifications as read.
- Unread count is emitted after changes.

---

## 16. Messaging and Chat System

### Conversation Creation

`ChatService.getOrCreateChat`:

- Requires `orderId`.
- Rejects chatting with self.
- Loads order.
- Validates both participants are linked to the order user/provider.
- Finds existing one-to-one chat for that order and participants.
- Creates chat if missing.

### Message Send

`ChatService.saveMessage`:

- Loads chat.
- Ensures sender is participant.
- Determines receiver as the other participant.
- Saves message with text/type/file/location.
- Updates chat last message and unread count atomically.
- Sends notification to receiver.

### Message Read

- `markAsRead` verifies membership.
- Resets unread count for the user.
- Marks received unread messages as read and sets `readAt`.

### File Upload

`POST /chat/upload`:

- Stores files under `uploads/chat`.
- Max 5MB.
- Allowed mimetypes include jpg/jpeg/png/gif/pdf/doc/docx.
- Returns URL using `APP_URL` or `API_URL` fallback to `http://localhost:3001`.

### Realtime Chat

`ChatGateway` namespace `/chat`:

- Secures join/send/typing/read events with `WsJwtGuard`.
- Verifies membership before joining chat rooms and typing.
- Tracks online socket IDs per user.
- Emits online/offline, new message, typing, and read receipt events.

---

## 17. Admin Features

Admin Dashboard backend capabilities:

- Admin authentication and refresh tokens.
- Admin account management with permission safeguards.
- Provider list/detail/search/filter/facets.
- Provider approval/rejection/update/status/delete.
- Service CRUD and service stats.
- User list/search/detail/status/update/delete.
- Vehicle list/detail/stats/top models/distribution/year stats/user vehicles/delete.
- Order/booking analytics.
- Revenue analytics.
- Subscription plans and subscription lists/stats.
- Wallet platform and owner financial views.
- Payout processing.
- Manual wallet adjustments.
- Notification campaigns, history, and stats.
- Audit log search/stats/export/entity history.
- AI recommendation analytics and CSV export.
- Settings and maintenance mode.
- Provider Excel-style summary with KPIs, data quality, coverage, working hours, and insights.

Admin authorization model:

- Every admin route depends on bearer JWT through global guard.
- Role must be `admin`.
- Permission strings are enforced per route with `PermissionsGuard`.
- `*` and `all` bypass specific permission checks.

---

## 18. Provider Features

Provider Dashboard backend capabilities:

- Login through `/auth/login` after admin approval activates provider user.
- Get/update provider profile.
- Update shop location.
- Update runtime status.
- Manage offered services, prices, and availability.
- Manage working hours.
- Upload and update documents.
- Store bank account.
- View dashboard summary, order stats, revenue stats, and service performance.
- List/manage assigned orders through orders APIs scoped by role.
- Update order status and location.
- Receive notifications.
- Chat with customer through order-linked chat.
- View wallet and transactions.
- Request withdrawals/payouts.
- Respond to reviews.

Provider restrictions:

- Provider self endpoints resolve provider profile by JWT phone number.
- Provider order changes are limited to assigned orders.
- Provider location/status/service updates require provider profile to exist.
- Runtime status update is intended for approved/active providers.

---

## 19. User Features

Customer-facing backend capabilities:

- Register, verify OTP, login, refresh, logout.
- Restore inactive account.
- Reset password by OTP.
- Manage profile and preferences.
- Manage vehicles.
- Manage maintenance records and reminders.
- Discover providers and services.
- Create immediate orders and scheduled bookings.
- Track order/provider location.
- Cancel orders when allowed.
- Confirm completion.
- Review completed orders.
- Manage wallet and redeem loyalty points.
- Initialize payment through mock Cham Cash.
- Subscribe/renew/upgrade/cancel subscriptions.
- Manage addresses.
- Manage payment methods.
- View and apply offers.
- Create recurring wash plans.
- Register FCM devices.
- Chat with provider.
- Receive notifications.

---

## 20. Validation Layer

### Global Validation

`CoreModule` registers a global `ValidationPipe`:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- `enableImplicitConversion: true`

`main.ts` also registers a global validation pipe with similar settings.

### DTO Validation Examples

- Auth:
  - Syrian phone format.
  - password strength.
  - terms accepted.
  - 6-digit OTP.
- Provider:
  - Mongo IDs for services.
  - unique max 50 services.
  - exactly 7 working days.
  - time format `HH:mm`.
  - valid status/category enums.
- Orders:
  - service ID required.
  - location object and coordinates.
  - cancellation reason required.
  - review rating 1 to 5.
- Customer experience:
  - address max lengths.
  - nested coordinates.
  - payment method enum.
  - wash plan visits in `1, 2, 4`.
  - offer type enum and non-negative value.
- Vehicles:
  - year business validation between 1900 and next year.
  - VIN exactly 17 characters if provided.
  - reminder requires date or mileage.
- Wallet:
  - positive amount/points.
  - order ID validation where needed.
- Subscriptions:
  - plan IDs.
  - tier/status and numeric plan values.

### Business Rule Validation

Important business validations live in use cases:

- Provider selected for order must offer the service.
- Service availability cannot be false.
- State machine enforces order transitions.
- Only owners/admins/providers can act on specific resources.
- Wallet balance must be sufficient.
- Subscription active state is enforced.
- Provider service prices must map to selected services.
- Offer can only be applied once and only to eligible pending orders.

---

## 21. Error Handling

Registered global filter:

- `HttpExceptionFilter` catches Nest `HttpException` and returns a normalized JSON error response.

Error logging:

- `HttpExceptionFilter` logs status and message.
- `LoggingInterceptor` logs request, response, and error timing.
- Service-specific loggers exist in payments, notifications, AI recommendation, WhatsApp, gateways, and bootstrap.

Common exception classes used:

- `BadRequestException`
- `UnauthorizedException`
- `ForbiddenException`
- `NotFoundException`
- `ConflictException`
- `ServiceUnavailableException`
- `InternalServerErrorException`
- `WsException`

Implementation note:

- `AllExceptionsFilter` exists but is not registered globally, so non-HTTP exceptions are handled by Nest default behavior unless thrown inside code paths converted to `HttpException`.
- `TimeoutInterceptor` exists but is not registered globally.

---

## 22. External Integrations

### MongoDB Atlas or Local MongoDB

Configured by `MONGODB_URI`. The default fallback in `env.config.ts` is local:

```text
mongodb://localhost:27017/car_hero
```

### Firebase Cloud Messaging

Used by `NotificationsService` if all credentials exist:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

If credentials are missing, push notifications are disabled but in-app persistence and Socket.IO still work.

### WhatsApp Web

Packages:

- `whatsapp-web.js`
- `qrcode`
- `qrcode-terminal`

Used by WhatsApp module and referenced by OTP service. In current OTP implementation, actual WhatsApp sending is commented out and OTP is fixed for development.

### Mock Cham Cash

The backend implements an internal mock payment gateway:

- Checkout page: `/mock-cham-cash/checkout/:referenceId`
- Process form: `/mock-cham-cash/process/:referenceId`
- Webhook: `/payments/webhook/cham-cash`

Webhook signature uses an HMAC secret hardcoded in `ChamCashService` as `CHAM_CASH_MOCK_SECRET_KEY`.

### AI Inference Service

`AI_RECOMMENDATION_MODE=ml_model` enables attempts to call an external FastAPI-style service through `AI_SERVICE_URL`. If inference fails, the implementation falls back to rule-based recommendations.

### Twilio/SMS

Environment variables exist for Twilio, but the analyzed OTP implementation does not send through Twilio. OTP service references WhatsApp, not Twilio.

### Redis

Redis environment variables and packages exist, but `CacheModule.register` in `AppModule` is configured without a Redis store. Current cache behavior is in-memory unless changed elsewhere.

---

## 23. Environment Configuration

Configuration is loaded by `ConfigModule.forRoot` with:

- `isGlobal: true`
- `load: [envConfig]`
- `envFilePath: ['.env', '.env.local']`

Documented keys from `.env.example` and `env.config.ts`:

| Variable | Purpose | Default / Notes |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `3000` |
| `API_PREFIX` | Global REST prefix | `api/v1` |
| `MONGODB_URI` | MongoDB connection string | fallback local `mongodb://localhost:27017/car_hero` |
| `JWT_SECRET` | Access token secret | required by `JwtStrategy` through `getOrThrow` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | required for refresh verification |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `OTP_EXPIRY_MINUTES` | Config value for OTP expiry | default 5, but `OtpService` directly uses 5 minutes |
| `FIREBASE_PROJECT_ID` | Firebase project | optional, disables FCM if missing |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | optional |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | optional |
| `WHATSAPP_API_PASSWORD` | Password for WhatsApp control endpoints | checked by WhatsApp controller |
| `THROTTLE_TTL` | Intended throttle TTL | `.env.example` documents it, AppModule hardcodes 60000 |
| `THROTTLE_LIMIT` | Intended throttle limit | `.env.example` documents it, AppModule hardcodes 20 |
| `SMS_PROVIDER` | SMS provider selector | default `twilio`, not used by current OTP send path |
| `TWILIO_ACCOUNT_SID` | Twilio SID | not used in current OTP service |
| `TWILIO_AUTH_TOKEN` | Twilio token | not used in current OTP service |
| `TWILIO_PHONE_NUMBER` | Twilio sender | not used in current OTP service |
| `REDIS_HOST` | Redis host | default `localhost`, cache not wired to Redis by default |
| `REDIS_PORT` | Redis port | default `6379` |
| `MAX_FILE_SIZE` | Upload config value | default 10MB, specific upload interceptors also define own limits |
| `UPLOAD_DEST` | Upload destination | default `./uploads` |
| `AI_RECOMMENDATION_MODE` | `rule_based` or `ml_model` | default rule-based |
| `AI_SERVICE_URL` | External AI service URL | default in example `http://localhost:8000` |
| `APP_URL` | Used by payment/chat URLs | referenced in code but not in `.env.example` |
| `API_URL` | Used by chat upload URL fallback | referenced in code but not in `.env.example` |

Do not commit real `.env` secrets. This repository contains a `.env` file locally; this document intentionally does not reproduce its contents.

---

## 24. Security Architecture

Implemented protections:

- Global JWT requirement for all non-public HTTP routes.
- Admin, provider, and user role checks where declared.
- Fine-grained admin permission checks.
- Passwords hashed with bcrypt.
- Refresh tokens hashed before storage.
- OTP max attempt limit.
- Pending registration TTL.
- Global DTO whitelist and non-whitelisted field rejection.
- ObjectId pipe for selected routes.
- Ownership checks in orders, vehicles, chat, reviews, addresses, payment methods, wash plans.
- Wallet balance checks before debits.
- HMAC verification for mock Cham Cash webhook.
- Maintenance mode gate.
- Helmet enabled.
- Throttler configured and AuthController guarded by `ThrottlerGuard`.

Security concerns to review:

- Access tokens are bearer tokens only; HttpOnly cookie transport is not implemented.
- OTP is fixed to `123456` and sending is disabled in current source.
- CORS uses `origin: true` with credentials, which reflects requesting origins.
- Helmet CSP is disabled.
- WebSocket `/ws` has several unguarded chat/typing events in `AppGateway`; the dedicated `/chat` gateway is stricter.
- Mock Cham Cash secret is hardcoded.
- `AllExceptionsFilter` is not globally registered.
- Redis config exists but cache is in-memory by default.
- Throttle `.env` variables are documented but not used in AppModule throttler config.

---

## 25. Performance and Scalability

Implemented strategies:

- MongoDB indexes on high-traffic fields: users, providers, orders, wallets, transactions, reviews, notifications.
- Geospatial 2dsphere indexes for provider/order locations.
- Aggregation pipelines for admin analytics, recommendation analytics, rating stats, provider enrichment.
- Pagination in list endpoints.
- Cache usage:
  - vehicle list/search/default caches.
  - order detail cache keys such as `order_<id>` are cleared on mutations.
  - AI recommendation output cache based on service, city, urgency, rounded location.
  - provider metrics cache for AI scoring.
  - short in-memory cache for admin Excel summary.
- Chunked notification broadcast insertion and delivery.
- Background scheduled processing for wash plans and scheduled notification dispatch.
- Mongoose transaction attempts for wallet operations, with fallback for local non-transaction MongoDB.

Scalability concerns:

- CacheModule is in-memory, so multi-instance deployments will not share cache state.
- Broadcast notifications use application timers and `setImmediate`, not a durable job queue.
- Scheduled notification dispatch runs in every app instance if horizontally scaled.
- Uploaded files are stored locally under `uploads`, not shared object storage.
- Some admin analytics aggregate over entire collections and may need date filters or materialized summaries at scale.

---

## 26. Complete Business Logic Inventory

Authentication:

- Registration stores pending data before user creation.
- Account type is forced to `customer` unless explicitly `provider`.
- Provider users start inactive until approval.
- OTP max attempts: 3.
- OTP validity: 5 minutes.
- Refresh tokens are rotated and stored as hashes.
- Logout clears refresh token and records a logout document.

Admin:

- Admin login requires active account.
- Admin permissions control dashboard features.
- Cannot remove last active admin manager.
- Cannot deactivate/delete self.

Provider:

- Public provider apply creates or updates by phone.
- Coordinates must be valid.
- Provider service prices must belong to selected services.
- Every selected service must exist and be active.
- Working hours require every weekday exactly once.
- Closing time must be after opening time for non-closed days.
- Admin approval activates provider and linked user.
- Admin rejection deactivates provider and linked user and stores reason.

Services:

- Service categories use `ServiceCategory` enum.
- Admin service category validation rejects unknown categories.
- Public lists focus on active services.

Orders:

- Provider selected for order must offer requested service.
- Provider-specific price overrides service base/discounted price.
- Scheduled provider booking checks availability.
- Status changes must follow state machine.
- Terminal orders cannot transition.
- Provider can update only assigned orders.
- Users can cancel eligible orders.
- Cancellation refunds completed payments and restores redeemed points.
- Completion triggers provider earnings transfer.
- Customer confirmation finalizes orders awaiting customer confirmation.

Wallet:

- Wallets are owner-type isolated.
- Debits require sufficient balance.
- Provider payout amount must meet minimum withdrawal setting.
- Payout rejection credits funds back.
- Commission formula is gross times commission rate.
- Loyalty point value is 0.05.
- Loyalty redemption cannot exceed order payable amount.

Subscriptions:

- User cannot subscribe if already active.
- Paid plans require wallet funds.
- Renew extends from current end date when still active.
- Upgrade charges full new plan and cancels old subscription.
- Deferred cancellation disables auto-renew but keeps access until end date.
- Immediate cancellation ends access immediately.

Reviews:

- Only completed orders can be reviewed.
- Only owner or admin can create review.
- One review per order.
- Provider response allowed to matching provider or admin.
- Provider rating recalculates after review create/delete.

Notifications:

- Broadcast audience must be one of all/users/premium/providers.
- Push delivery respects user push preference.
- Scheduled notifications are dispatched when due.

Chat:

- Chat requires an order.
- Participants must be linked to that order.
- Sender must be participant.
- Read state and unread counts are per recipient.

Customer experience:

- First address/payment method becomes default.
- Deleting a default address/method reassigns a replacement when available.
- Cash payment method cannot be deleted.
- Card payment method requires brand, last4, and provider token.
- Offer can only be used once per user.
- Offer can apply only to eligible pending unpaid order.
- Wash plan requires owned vehicle and optional owned address.
- Wash booking requires active car wash service.

Vehicles:

- Vehicle year must be 1900 through next calendar year.
- VIN must be 17 characters if provided.
- Maximum 10 vehicles per user.
- First vehicle becomes default.
- Cannot delete the only default vehicle.
- Reminder requires reminder date or mileage threshold.
- Maximum 20 reminders per vehicle.

AI recommendation:

- Fetch active/approved matching providers by service and city.
- Fallback to active/approved providers in city if no category matches.
- If no candidates, log failed recommendation.
- Rule-based scoring uses distance, rating, service match, working hours, emergency support, response time, completed orders, cancellation rate, city match, urgency alignment.
- Emergency requests increase emergency and urgency weight.
- Normal requests move emergency weight into rating and completed orders.
- 5 percent exploration may inject emerging providers.
- ML mode falls back to rule-based on inference failure.

---

## 27. Developer Guide

### Prerequisites

- Node.js compatible with NestJS 11.
- npm.
- MongoDB local or Atlas.
- Optional Firebase credentials.
- Optional WhatsApp session setup.

### Install

```bash
cd CAR_HERO_BACKEND
npm install
```

### Configure

Create `.env` from `.env.example` and set at minimum:

```bash
PORT=3000
API_PREFIX=api/v1
MONGODB_URI=mongodb://localhost:27017/car_hero
JWT_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me-too
```

For local database:

```bash
npm run db:start-local
```

The local DB script is present in `package.json`; inspect `scripts/start-local-mongodb.js` for exact behavior.

### Run Development Server

```bash
npm run start:dev
```

API:

```text
http://localhost:3000/api/v1
```

Swagger:

```text
http://localhost:3000/api-docs
http://localhost:3000/api-docs-json
```

### Build

```bash
npm run build
```

Production start script:

```bash
npm run start:prod
```

### Lint and Format

```bash
npm run lint
npm run format
```

### Tests

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

Test coverage exists for auth/admin login, orders, providers, services, subscriptions, chat security, notifications, customer experience, vehicles, wallet use cases, and e2e app bootstrap.

### Seeding and Postman

Available scripts:

```bash
npm run seed
npm run postman:validate
npm run postman:publish
npm run docs:sync
```

### Debugging Tips

- Use Swagger for route shape.
- Check `LoggingInterceptor` output for request/response timings.
- For auth issues, inspect `JwtAuthGuard` logs and JWT payload.
- For maintenance lockout, check `settings` collection key `app_config`.
- For provider dashboard issues, verify provider user phone matches provider `phone`.
- For wallet transaction issues on local MongoDB, remember transaction fallback may be used if replica set transactions are unavailable.

---

## 28. Known Limitations

Observed directly from source:

- OTP uses fixed dev code `123456` and does not send through WhatsApp in current implementation.
- HttpOnly cookie auth is not implemented; auth uses bearer tokens.
- CORS is broad with credentials enabled.
- Helmet CSP is disabled.
- Redis packages/config exist but cache is not wired to Redis in AppModule.
- Throttler environment variables exist but AppModule hardcodes TTL/limit.
- Some successful controller returns include their own `success`, causing nested success objects under global response wrapping.
- `AllExceptionsFilter` and `TimeoutInterceptor` exist but are not globally registered.
- `ProfileController` has no routes in the analyzed implementation.
- Mock Cham Cash secret is hardcoded and the gateway is internal/demo style.
- Mock Cham Cash URL generation does not automatically include the global API prefix. `ChamCashService` builds `/mock-cham-cash/...`, while the mock process webhook posts to `/api/payments/webhook/cham-cash`; with the default prefix `api/v1`, `APP_URL` must be configured carefully or these links can miss the mounted routes.
- File uploads are stored on local disk.
- AI ML mode depends on external service and falls back to rule-based.
- Several Arabic strings in source appear as mojibake, indicating encoding issues in some files.
- User stats use case currently returns placeholder zeros for order stats.
- Provider earnings duplicate detection should be reviewed because it searches for transaction type `deposit` while stored transaction types use enum values such as `credit`.
- `/ws` gateway has some unguarded chat/typing events, while `/chat` gateway has stronger membership checks.

---

## 29. Complete Backend Feature Inventory

Authentication:

- Customer registration.
- Provider registration.
- OTP verification.
- OTP resend.
- Login.
- Refresh token.
- Forgot password.
- Reset password.
- Restore inactive account.
- Logout.
- Current user lookup.
- Admin login/refresh/logout.

Admin:

- Admin account CRUD.
- Admin permissions.
- Provider moderation.
- User management.
- Vehicle management.
- Service management.
- Subscription and membership management.
- Settings and maintenance.
- Dashboard analytics.
- Excel-style provider summary.
- Audit logs.
- Notification campaigns.
- Wallet and payout management.
- AI recommendation analytics.

Provider:

- Public provider application.
- Public provider discovery.
- Nearby providers.
- Top rated providers.
- Provider profile.
- Provider location.
- Provider status.
- Provider services/prices/availability.
- Provider working hours.
- Provider documents.
- Provider bank account.
- Provider dashboard stats.
- Provider wallet and payouts.
- Provider order management.
- Provider review responses.

Customer:

- Profile.
- Vehicles.
- Maintenance records.
- Reminders.
- Services.
- Orders.
- Bookings.
- Order tracking.
- Payments.
- Wallet.
- Loyalty point redemption.
- Subscriptions.
- Reviews.
- Notifications.
- Chat.
- Addresses.
- Payment methods.
- Offers.
- Recurring wash plans.
- Device registration.

Realtime:

- Order room updates.
- Order status updates.
- Provider order location updates.
- Provider profile location updates.
- Chat messages.
- Typing indicators.
- Read receipts.
- Online/offline presence.
- Notifications and unread count.

Financial:

- Wallet balances.
- Transactions.
- Provider earnings.
- Commission.
- Platform wallet.
- Payout request and processing.
- Loyalty points.
- Subscription fee transactions.
- Mock Cham Cash wallet top-up.

AI and analytics:

- Provider recommendation.
- Rule-based scoring.
- Optional ML inference.
- Recommendation logs.
- Provider metrics.
- Recommendation analytics.
- CSV export.
- Model retraining trigger.

Operational:

- Swagger docs.
- Static upload serving.
- EJS views.
- MongoDB configuration.
- Schedule jobs.
- Event bus.
- Logging.
- Validation.
- Maintenance mode.

---

## 30. How CAR_HERO_BACKEND Works Internally

Car Hero backend starts in `main.ts`, creates a Nest Express app, serves uploads, enables broad CORS, applies validation, sets the `/api/v1` prefix, and publishes Swagger. `AppModule` then wires the system together: config, MongoDB, cache, throttling, scheduler, event bus, WhatsApp, and every business module.

Every non-public HTTP request passes first through the global JWT guard. If the route is not decorated with `@Public()`, the bearer token is validated by `JwtStrategy`. Admin tokens load from the `admins` collection and attach permissions. User/provider tokens load from `users`; provider tokens also resolve `providerId` from the provider profile when needed. The maintenance guard then checks whether the app is in maintenance mode. Admins bypass maintenance, public routes bypass it, and everyone else receives 503 while maintenance is active.

Controllers are thin. They accept validated DTOs, extract the current user with `@CurrentUser`, then call use cases or services. The important business rules are not in the database. They live in application use cases: order state transitions, provider service validation, wallet balance checks, subscription charging, provider approval, review creation, and chat membership.

MongoDB is the source of truth. Users, providers, services, orders, wallets, subscriptions, reviews, notifications, chats, vehicles, AI logs, and audit logs are stored as Mongoose documents. Some modules use repositories behind interfaces, while others use Mongoose models directly for aggregation-heavy admin and customer-experience flows.

A customer signs up through pending registration. The backend stores the phone, hashed password, account type, and OTP in `pending_registrations`. After OTP verification, the backend creates a real user. If the account is a provider, it also creates a pending provider profile and keeps the provider user inactive until an admin approves it. Admin approval activates both provider profile and linked user.

Services define what can be ordered. Providers declare which active services they offer, how much they charge for each service, and whether each service is available. When a customer creates an order, the backend verifies the service, provider, availability, schedule, and price. The order starts as `pending`, then moves through the state machine. Every important status change creates history. Completion transfers provider earnings and platform commission through the wallet ledger.

The wallet system treats every movement as a transaction. Users, providers, and the platform each have separate wallets. Provider payout requests deduct balance immediately and create pending debit transactions. Admin processing completes or rejects those transactions. Subscription purchases and renewals charge the user wallet. Loyalty point redemption reduces order payable amount and records a loyalty transaction.

Reviews are allowed only after completed orders. Creating or deleting a review recalculates provider rating from visible reviews. This also feeds AI provider metrics through events.

The notification system stores notifications in MongoDB, pushes real-time messages through Socket.IO, and optionally sends FCM push notifications if Firebase credentials are present. Admin broadcasts can target all users, premium users, normal users, or providers, and can be scheduled.

Chat is order-bound. A conversation can only be created when both participants are attached to the same order. Messages are persisted, unread counts are updated, and the `/chat` namespace enforces JWT and membership checks before room participation.

The AI recommendation system is mainly rule-based unless `AI_RECOMMENDATION_MODE` asks for ML. It fetches matching providers, falls back to broader city providers when needed, calculates scores from distance, rating, service match, working hours, emergency support, response time, order history, cancellation rate, city match, and urgency, then logs the recommendation. If ML inference fails, the system falls back to rule-based recommendations.

Admin APIs sit on top of the same data but add broad aggregation views: providers, users, services, vehicles, orders, revenue, subscriptions, wallet transactions, audits, notifications, and AI recommendations. Admin authorization is permission-based, so the same admin role can be limited by permission strings.

In short, the backend is a modular NestJS system with MongoDB persistence, JWT authorization, DTO validation, event-driven side effects, Socket.IO realtime features, and application-use-case business logic. The central domain is a service order lifecycle connecting customers, providers, vehicles, services, payments, wallets, subscriptions, reviews, notifications, and chat.
