# AI-Powered Smart Facility & Support Operations System

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Stack](https://img.shields.io/badge/Stack-NestJS%20%7C%20React%20%7C%20Python%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

A smart operations platform for managing facilities, support workflows, visitors, HR operations, and AI-assisted intelligence.

The system is designed as a scalable foundation for workplace operations and future SaaS expansion.

## Core Operational Areas

- Facility operations
- Support ticketing
- Visitor workflows
- HR and workforce operations
- AI-assisted intelligence

## Product Scope

### Facility Operations

- Room bookings
- Booking approvals
- Availability tracking
- Meeting readiness
- Facility utilization
- No-show tracking
- Future forecasting

### Support Operations

- Ticket creation
- Issue categorization
- Ticket assignment
- Reassignment
- Escalation
- Progress tracking
- Resolution
- Accountability

### Visitor Workflows

- Visitor records
- Check-in
- Check-out
- Host linking
- Reception flow
- Arrival alerts
- Visit history

### HR & Workforce Operations

- Employee records
- Departments
- Teams
- Roles
- Reporting lines
- Leave management
- Shifts
- Rosters
- Onboarding
- Offboarding

### Payroll Foundation

- Payroll profiles
- Compensation references
- Attendance context
- Leave records
- Audit readiness

Full payroll workflows will come later.

Future payroll scope:

- Payroll processing
- Payslip generation
- Statutory deductions
- Tax handling
- Payroll approvals

### AI-Assisted Intelligence

- No-show prediction
- Ticket categorization
- Intelligent routing
- Anomaly detection
- Forecasting
- Workforce insights
- Natural language support
- Operational recommendations

The AI layer will run as a separate intelligence service connected to the core platform.

## Technology Stack

### Backend

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Redis
- BullMQ

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion

### AI Service

- Python
- FastAPI
- Machine Learning APIs
- Prediction APIs
- Classification APIs
- Forecasting APIs
- Natural Language APIs

## System Architecture Overview

```mermaid
flowchart TD
    A[Client Applications] --> A1[Admin Dashboard]
    A --> A2[Facility Manager / Secretary Dashboard]
    A --> A3[PM / Support Coordinator Dashboard]
    A --> A4[Technician / Developer Workspace]
    A --> A5[Employee Portal]
    A --> A6[Reception / Visitor Interface]
    A --> A7[HR / Workforce Dashboard]

    A1 --> B[Core API Layer - NestJS]
    A2 --> B
    A3 --> B
    A4 --> B
    A5 --> B
    A6 --> B
    A7 --> B

    B --> C[Auth Module]
    B --> D[Users and Roles Module]
    B --> E[Facilities Module]
    B --> F[Bookings Module]
    B --> G[Tickets Module]
    B --> H[Visitors Module]
    B --> I[HR Module]
    B --> J[Activity and Notifications Module]
    B --> K[AI Integration Module]

    C --> L[(PostgreSQL + Prisma)]
    D --> L
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L

    B --> M[(Redis + BullMQ)]

    K --> N[Python FastAPI AI Service]
    N --> N1[No-show Prediction]
    N --> N2[Ticket Categorization]
    N --> N3[Intelligent Routing]
    N --> N4[Anomaly Detection]
    N --> N5[Forecasting]
    N --> N6[Natural Language Support]
```

## Operational Flow Overview

```mermaid
flowchart TD
    A[User Logs In] --> B[Role-Based Access Control]

    B --> C[Admin]
    B --> D[Facility Manager / Secretary]
    B --> E[Support Coordinator / PM]
    B --> F[Technician / Developer]
    B --> G[Employee]
    B --> H[Reception]
    B --> I[HR Officer]

    C --> C1[Manage Users, Roles, Facilities, Tickets, HR, Visitors and Reports]

    D --> D1[Manage Facilities]
    D --> D2[Approve or Reject Bookings]
    D --> D3[Track Facility Usage]

    E --> E1[Review Tickets]
    E --> E2[Assign Tickets]
    E --> E3[Escalate Issues]
    E --> E4[Monitor Resolution Progress]

    F --> F1[Receive Assigned Tickets]
    F --> F2[Update Progress]
    F --> F3[Resolve Issues]

    G --> G1[Book Facilities]
    G --> G2[Create Tickets]
    G --> G3[Request Leave]
    G --> G4[View Activity]

    H --> H1[Register Visitors]
    H --> H2[Link Visitor to Host]
    H --> H3[Confirm Meeting Context]
    H --> H4[Notify Host]

    I --> I1[Manage Employees]
    I --> I2[Manage Departments and Teams]
    I --> I3[Track Leave and Availability]
    I --> I4[Prepare Payroll Foundation]
```

## HR and Payroll Foundation Flow

```mermaid
flowchart TD
    A[Employee Record Created] --> B[Department Assigned]
    B --> C[Designation Assigned]
    C --> D[Reporting Line Defined]
    D --> E[Employment Status Tracked]

    E --> F[Leave Records]
    E --> G[Shift and Roster Records]
    E --> H[Attendance Context]
    E --> I[Compensation Reference]

    F --> J[Payroll Foundation]
    G --> J
    H --> J
    I --> J

    J --> K[Future Payroll Workflows]
    K --> K1[Salary Processing]
    K --> K2[Allowances]
    K --> K3[Deductions]
    K --> K4[Statutory Contributions]
    K --> K5[Payslip Generation]
    K --> K6[Payroll Reports]
```

## AI Layer Flow

```mermaid
flowchart TD
    A[Core Platform Data] --> B[AI Integration Layer]

    B --> C[Facility Booking Data]
    B --> D[Ticket Data]
    B --> E[Visitor Data]
    B --> F[HR and Workforce Data]

    C --> G[No-show Prediction]
    C --> H[Facility Usage Forecasting]

    D --> I[Ticket Categorization]
    D --> J[Intelligent Routing]
    D --> K[Escalation Suggestions]

    E --> L[Visitor Pattern Insights]

    F --> M[Workforce Availability Insights]
    F --> N[Shift and Leave Pattern Analysis]

    G --> O[AI Recommendations]
    H --> O
    I --> O
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O

    O --> P[Dashboards, Notifications and Reports]
```

## Core Modules

- Auth
- Users
- Roles and Permissions
- Facilities
- Bookings
- Tickets
- Visitors
- HR
- Departments
- Teams
- Leave
- Shifts and Rosters
- Notifications
- Activity Logs
- Reports
- AI Integration

## User Roles

- Super Admin
- Admin
- Facility Manager
- Secretary
- Support Coordinator
- Project Manager
- Team Lead
- Technician
- Developer
- HR Officer
- Employee
- Receptionist

Access is controlled through role-based permissions.

## Authentication

Planned authentication features:

- Registration
- Login
- JWT authentication
- Password hashing
- Protected routes
- User status control
- Role-based access
- Future OTP verification
- Future Google Sign-In

## Database Foundation

Main entities may include:

- User
- Role
- Permission
- Department
- Team
- EmployeeProfile
- Facility
- Booking
- Ticket
- TicketCategory
- TicketAssignment
- Visitor
- LeaveRequest
- Shift
- DutyRoster
- Notification
- ActivityLog
- AIInsight
- PayrollProfile
- CompensationReference

The database should support future expansion without breaking existing modules.

## Payroll Readiness

Payroll is not fully implemented in the foundation stage.

The system prepares for payroll through:

- Employee payroll profiles
- Employment types
- Compensation references
- Basic salary references
- Allowance readiness
- Deduction readiness
- Statutory contribution readiness
- Leave and attendance context
- Payroll status
- Payroll notes
- HR and payroll audit logs

## Reporting Readiness

Future reports may include:

- Facility booking reports
- Facility utilization reports
- Ticket resolution reports
- Escalation reports
- Visitor reports
- HR reports
- Leave reports
- Shift reports
- Payroll readiness reports
- AI prediction reports
- Operational dashboards

## Development Focus

Current focus:

- Clean backend architecture
- Scalable database design
- Role-based access control
- Facility operations
- Support ticketing
- Visitor workflows
- HR foundation
- Payroll readiness
- AI integration readiness
- Future SaaS expansion

## Future Expansion

Planned future features:

- Full payroll workflows
- Advanced HR automation
- Visitor self-check-in
- Calendar integrations
- Email and SMS notifications
- AI assistant features
- Voice and natural language commands
- Meeting automation
- Facility recommendations
- SLA tracking
- Advanced analytics
- Multi-tenant SaaS support
- Mobile apps

## Repository Purpose

This repository provides the foundation for a smart operations platform covering workplace management, support workflows, facility scheduling, workforce visibility, visitor coordination, and future AI automation.

## License

This project is proprietary.

All rights reserved.
