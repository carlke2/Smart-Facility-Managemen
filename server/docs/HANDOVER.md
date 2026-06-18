# 🚀 Smart Facility Backend: Handover & Roadmap

This document provides a technical overview of the backend foundation established for the **Smart Facility** platform.

---

## 🏗️ What Has Been Achieved

We have successfully laid a production-ready **NestJS** foundation that strictly separates the two core domains of the project while maintaining their necessary intersections.

### 1. Technology Stack (Locked)
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma 7.8.0
- **Database**: PostgreSQL (Supabase) + Redis (Real-time Cache)
- **Monitoring**: NestJS Schedule (Heartbeat/Cron)
- **Ingestion**: Global ActivityLogger Interceptor

### 2. Database & Domain Model (Enterprise Ready)
- **Multi-Tenancy**: Added `Organization` and `Site` models to support hierarchical facility management.
- **AI Context**: Added `metadata` JSON fields to `Booking` and `Ticket` to store unstructured sensor data.
- **Real-time**: Integrated `SensorsModule` with Redis for occupancy and telemetry tracking.

### 3. Core Infrastructure
- **Activity Ingestion**: Every state-changing request (POST/PATCH/DELETE) is now automatically captured by a global interceptor for AI training.
- **Ghost Detection**: A 5-minute heartbeat service is now active in the `FacilityModule` to compare active bookings with real-time sensor data.


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
