# CECOS Student Information System & Learning Management System

## Overview

This is a comprehensive Student Information System (SIS) and Learning Management System (LMS) built for educational institutions. The application features a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM. It provides role-based access control for students, faculty, administrators, and EPR administrators with features including student management, attendance tracking, exam management, grade management, admissions processing, and user privilege management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **UI Pattern**: Tab-based interface with sidebar navigation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store
- **Middleware**: CORS, body parsing, authentication middleware, role-based authorization

### Database Architecture
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe queries
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication & Authorization
- JWT token-based authentication system
- Role-based access control (student, faculty, admin, epr_admin)
- Password hashing with bcrypt
- Protected routes and API endpoints
- User privilege management system

### User Interface Components
- **Layout System**: Sidebar navigation with tab-based content area
- **Component Library**: shadcn/ui with Radix UI primitives
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme System**: CSS variables for consistent theming with burgundy color scheme
- **Form Management**: React Hook Form with Zod validation

### Data Management
- **Student Management**: Complete student lifecycle management
- **Faculty Management**: Faculty profiles and department assignments
- **Course Management**: Course creation and enrollment systems
- **Attendance Tracking**: Real-time attendance marking and reporting
- **Exam Management**: Exam scheduling, submission tracking, and grading
- **Admissions Processing**: Application review and approval workflow

### Core Modules
1. **Dashboard**: Overview statistics and quick actions
2. **Student Management**: Student profiles, enrollment, and academic records
3. **Attendance Tracking**: Daily attendance marking and analytics
4. **Exam Management**: Exam creation, scheduling, and submission handling
5. **Grade Management**: Grade assignment and feedback system
6. **Admissions**: Application processing and status management
7. **User Privileges**: Role and permission management

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Server validates credentials and generates JWT token
3. Token stored in localStorage and included in API requests
4. Server middleware validates token and extracts user information
5. Role-based access control enforced on both client and server

### Data Fetching Pattern
1. React Query manages server state with automatic caching
2. API requests made through centralized request function
3. Error handling with toast notifications
4. Optimistic updates for better user experience
5. Background refetching for real-time data

### Tab Management System
1. Sidebar navigation opens new tabs for different modules
2. Tab state managed through custom hook
3. Each tab can contain different components with props
4. Tab switching preserves component state
5. Closable tabs with automatic fallback to dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **drizzle-orm**: Type-safe database queries
- **express**: Web framework
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **TypeScript**: Type safety across the stack
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundler for production
- **Drizzle Kit**: Database schema management
- **PostCSS**: CSS processing

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets in `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push` command
4. **Environment Variables**: Database URL and JWT secret configured

### Production Setup
- **Server**: Express server serves both API and static frontend files
- **Database**: PostgreSQL database with connection pooling
- **Environment**: Production mode with optimized builds
- **Security**: CORS configured, secure headers, rate limiting considerations

### Development Workflow
- **Hot Reload**: Vite HMR for frontend development
- **API Development**: tsx with watch mode for backend
- **Database**: Local PostgreSQL or Neon cloud database
- **Type Safety**: Shared types between frontend and backend via `shared/` directory

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling efficient development and deployment while maintaining type safety across the entire stack.