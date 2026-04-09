# Car Hero Backend 🚗💨

A production-ready NestJS backend for Car Hero - a car services & roadside assistance platform. Built with a focus on scalability, security, and clean code.

## 🏗 Architecture & Principles (Architect Vision)

This project is governed by the strictly enforced development principles found in our [start.txt](file:///e:/CarHero/CAR_HERO_BACKEND/start.txt):

- **Clean Architecture Implementation**: Strict separation between `Domain`, `Application`, `Infrastructure`, and `Presentation` layers.
- **SOLID Design**: Ensuring classes are single-responsibility, open for extension, and loosely coupled.
- **Automated Verification**: Unit testing for all business logic (Use Cases) to prevent regressions.
- **Security-First Approach**: At-rest encryption for sensitive data and granular Ownership Verification (RBAC).
- **High Performance**: Redis-backed caching for real-time tracking and frequent queries.
- **Event-Driven & Reactive**: Automated background processes and event-triggered notifications.
- **Containerization & CI/CD**: Ready for modern cloud environments with Docker and GitHub Actions.

## 🌟 Key Features

- **OTP-based Authentication** - Phone number login with JWT tokens
- **Role-based Access Control** - User, Provider, Admin roles
- **Geospatial Queries** - Find nearby providers with MongoDB 2dsphere
- **Real-time Tracking** - Live provider location updates with Redis caching
- **Payment & Verification** - Secure payment confirmation and transaction logging
- **Background Cleanup** - Automated cron jobs for order lifecycle management
- **Real-time WebSocket** - Support for tracking, chat, and status updates

## 📦 Tech Stack

- **NestJS** - TypeScript framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **Passport JWT** - Authentication
- **Firebase Admin** - Push notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file with:
# - MongoDB URI
# - JWT secrets
# - Firebase credentials (optional)
```

### Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### API Documentation

Navigate to `http://localhost:3000/api` for Swagger documentation.

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── common/          # Shared decorators, guards, filters, pipes
├── database/        # Mongoose schemas
└── modules/         # Feature modules
    ├── auth/        # Authentication
    ├── users/       # User management
    ├── providers/   # Service providers
    ├── orders/      # Order management
    ├── chat/        # Messaging
    ├── wallet/      # Payments & loyalty
    ├── notifications/  # Push notifications
    └── gateway/     # WebSocket
```

## 🔐 Authentication

### User/Provider Login (OTP)

```bash
# Request OTP
POST /api/v1/auth/send-otp
{ "phone": "+966501234567" }

# Verify OTP
POST /api/v1/auth/verify-otp
{ "phone": "+966501234567", "otp": "123456" }
```

### Admin Login

```bash
POST /api/v1/auth/admin/login
{ "email": "admin@carhero.com", "password": "password" }
```

## 🗺️ Geospatial Queries

Find nearby providers:

```bash
GET /api/v1/providers/nearby?longitude=46.6753&latitude=24.7136&maxDistanceKm=10
```

## ⚡ WebSocket Events

Connect to `/ws` namespace:

### Client Events

- `join:order` - Join order room for updates
- `send:message` - Send chat message
- `update:provider:location` - Update provider location

### Server Events

- `order:status:updated` - Order status changed
- `order:location:updated` - Provider location update
- `message:new` - New chat message

## 🐳 Docker

```bash
docker build -t car-hero-backend .
docker run -p 3000:3000 car-hero-backend
```

## 📝 License

MIT
