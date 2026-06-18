# 🚀 Smart Facility Backend: Handover & Roadmap

This document provides a technical overview of the backend foundation established for the **Smart Facility** platform.

---

## 🏗️ What Has Been Achieved

We have successfully laid a production-ready **NestJS** foundation that strictly separates the two core domains of the project while maintaining their necessary intersections.

### 1. Technology Stack (Locked)
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma 7.8.0 (utilizing `@prisma/adapter-pg` for direct PostgreSQL connections)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT-based stateless auth with `@nestjs/passport`
- **Background Tasks**: BullMQ + Redis integration foundation
- **Validation**: Strict global pipes using `class-validator` and `joi`

### 2. Database & Domain Model
The `schema.prisma` is fully defined and synced with the live database.
- **Facility Domain**: `Room` and `Booking` entities.
- **Support Domain**: `Ticket` entity (supports linking to Rooms, Bookings, or Visitors).
- **Identity**: `User` entity supporting 7 distinct roles: `ADMIN`, `PM`, `SECRETARY`, `TEAM_LEAD`, `DEVELOPER`, `TECHNICIAN`, `CLIENT`.
- **Placeholder Entities**: `Visitor` and basic `Activity` log structure.

### 3. Core Infrastructure
- **Prisma v7 Service**: A specialized `PrismaService` that manually injects the connection pool via an adapter to satisfy the strict constructor requirements of Prisma 7 when connection strings are excluded from the schema.
- **Global Error Handling**: An `AllExceptionsFilter` that maps Prisma-specific errors (P2002, P2025) to standard HTTP status codes (409 Conflict, 404 Not Found, etc.).
- **Role-Based Access Control (RBAC)**: A global `RolesGuard` combined with a custom `@Roles()` decorator allows for granular permission management at the controller level.

### 4. Logic & Endpoints
- **Auth**: `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`.
- **Facility**: Full CRUD for Rooms and Bookings, including a **conflict detection algorithm** in `BookingsService` to prevent double-booking rooms.
- **Support**: CRUD for Tickets, allowing support staff to see the physical context (Room/Booking) of any incident.

---

## 🛠️ The Future Implementation Plan

The foundation is "AI-Ready" and "Scale-Ready." Here is the roadmap for the next phase:

### Phase A: Realizing Placeholders
1. **Visitor Management**: Move from placeholder to full logic. Implement visitor pre-registration and check-in workflows.
2. **Activity Engine**: Implement an interceptor or service to record all system actions into the `Activity` log. This is the **primary data source** for future AI training.
3. **Notification Delivery**: Implement the `NotificationsService` stubs using a provider like SendGrid or Resend, dispatched via the already-configured `notification-queue`.

### Phase B: AI Integration (Python FastAPI)
1. **Data Pipeline**: Feed the `Activity` and `Booking` data to a Python microservice.
2. **AI Gateway**: Connect the stubs in `AiGatewayService` to the Python API via `@nestjs/axios`.
3. **Intelligence Features**:
    - **No-show Prediction**: Predict if a booking will be abandoned based on user history.
    - **Ticket Routing**: Automatically categorize and assign tickets using NLP.

### Phase C: Advanced Support Workflows
1. **SLA Management**: Implement timers on tickets for automated escalation.
2. **Technician Dashboard**: Specialized views for users with the `TECHNICIAN` role.

---

## 📋 Technical Notes for the Developer
- **Environment**: Always copy `.env.example` to `.env`. The project will fail to start if `JWT_SECRET` is less than 16 characters or if `DATABASE_URL` is missing.
- **Redis**: You **must** have Redis running for the application to boot, as the `QueueModule` connects to it immediately.
- **Prisma Updates**: When changing the schema, run `npx prisma migrate dev` followed by `npx prisma generate`. The `PrismaService` handles the rest.
- **Architecture**: Keep business logic in `Services`. Use `Controllers` only for request/response handling. Keep the domain separation (Facility vs Support) clean.
