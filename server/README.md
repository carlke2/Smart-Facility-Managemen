# Smart Facility Management Platform (Backend)

A robust, production-ready backend foundation for a unified facility management system. Built with NestJS, Prisma, and PostgreSQL.

## 🚀 Features

- **Facility Management**: Intelligent room booking and availability tracking.
- **Support Operations**: Integrated ticketing system linked to physical assets.
- **Identity & Security**: Role-Based Access Control (RBAC) with 7 distinct project roles.
- **AI-Ready Architecture**: Dedicated gateway for Python FastAPI microservice integration.
- **Background Tasks**: Redis-backed BullMQ for non-blocking notifications and logs.

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Supabase)
- **Queue**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/)

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- Redis (Local or Cloud)
- PostgreSQL instance

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment:
   ```bash
   cp .env.example .env
   # Update .env with your credentials
   ```

### Running the App

```bash
# development
$ npm run start:dev

# production
$ npm run build
$ npm run start:prod
```

## 📖 API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
`http://localhost:3000/api/docs`

## 🏗️ Project Structure

- `src/modules/facility`: Room and Booking logic.
- `src/modules/support`: Ticket and Issue tracking.
- `src/modules/ai-gateway`: Integration boundary for AI services.
- `src/common`: Guards, Filters, and Decorators used across the app.
- `src/database`: Prisma service and connection handling.

---
*Created by [Antigravity AI](https://github.com/google-deepmind) for the Smart Facility Project.*
