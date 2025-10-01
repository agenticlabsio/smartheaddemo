# ProcureIQ Platform - AI-Powered Procurement Intelligence

## Overview

ProcureIQ is an enterprise SaaS platform for procurement intelligence and analytics. The platform provides AI-powered insights, automated data analysis, and real-time procurement intelligence for organizations managing large-scale spending ($52M+ annual procurement). Built with Next.js 15, React 19, and modern TypeScript, it offers a comprehensive suite of tools for procurement teams including insights approval workflows, AI chat assistance, data catalog management, and live support capabilities.

The platform serves enterprise clients with complex procurement needs across multiple facilities, cost centers, and supplier networks, focusing on risk management, spend optimization, and data-driven decision making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Core Technologies**
- Next.js 15.2.4 with App Router architecture for server-side rendering and routing
- React 19 with Server Components for optimal performance
- TypeScript with strict type checking for type safety
- Tailwind CSS with custom design system using CSS variables for theming

**UI Component System**
- Radix UI primitives for accessible, unstyled components (Dialog, Dropdown, Select, Tabs, etc.)
- Custom component library built with class-variance-authority for variant management
- shadcn/ui configuration for consistent component patterns
- Responsive design with mobile-first approach

**State Management & Data Flow**
- Client-side state using React hooks (useState, useRef, useEffect)
- No global state management library (Redux/Zustand) - using React's built-in capabilities
- Real-time streaming responses for AI chat interactions
- Optimistic UI updates for better user experience

**Design System**
- Professional SaaS color palette with dual theme support (light/dark)
- Custom CSS variables for colors, typography, and spacing
- Geist font family for sans-serif, Manrope for display text
- Consistent 0.5rem border radius across components

### Backend Architecture

**API Structure**
- Next.js API Routes for serverless functions
- RESTful endpoints organized by feature domain:
  - `/api/chat` - AI chat and conversation management
  - `/api/insights` - Procurement insights and recommendations
  - `/api/data-catalog` - Data source and table metadata
  - `/api/mcp` - Model Context Protocol tool execution
  - `/api/settings` - User preferences and configuration

**AI Integration**
- Vercel AI SDK with OpenAI GPT-4o model for chat interactions
- Streaming text responses for real-time user experience
- System prompts configured for procurement domain expertise
- Context-aware responses with enterprise spending data ($52M+ contexts)

**Data Layer**
- Mock data layer for development/demonstration (lib/mock-data.ts)
- Structured data models for procurement metrics, suppliers, facilities
- No database implementation currently - data served from in-memory structures
- Vercel Blob storage for chat history persistence

**Model Context Protocol (MCP) Client**
- Custom MCP implementation for structured AI tool access
- SQL query execution tools for procurement database access
- Tool registry with parameter validation and metadata
- Connection management for multiple data sources
- Execution tracking with performance metrics

### Authentication & Authorization

**Clerk Integration**
- Clerk for complete authentication solution
- Protected routes using Clerk middleware
- Route protection patterns:
  - Public: Landing page (`/`)
  - Protected: Dashboard, AI Assistant, Insights, Data Catalog, Settings
- Automatic redirect logic (authenticated users → dashboard)
- User session management and profile integration
- Sign-in/Sign-up modal flows

**Middleware Strategy**
- Custom middleware (middleware.ts) for route protection
- Route matchers for identifying protected paths
- Authenticated user redirection from home to dashboard
- Integration with Next.js middleware chain

### Data Storage & Persistence

**Vercel Blob Storage**
- Chat conversation persistence using Vercel Blob
- JSON-based chat data structure with metadata
- File naming convention: `chats/{chatId}-{timestamp}.json`
- CRUD operations: save, load, delete chat histories
- Public access pattern for blob URLs

**Data Models**
- Chat messages with role-based typing (user/assistant/system)
- Insights with approval workflow states (pending/approved/rejected)
- Supplier data with risk levels and spend metrics
- Facility and cost center hierarchies
- Mock procurement metrics for $52.3M total spend scenario

**No Traditional Database**
- Currently no SQL/NoSQL database implementation
- All data served from mock data structures
- Designed for future database integration (Drizzle ORM references in architecture)
- Blob storage as interim persistence layer

### Key Features & Modules

**Insights Approval Workflow**
- AI-generated procurement insights with confidence scores
- Multi-state approval process (pending → approved/rejected)
- Priority-based categorization (High/Medium/Low)
- Impact quantification with financial metrics
- Data source attribution and lineage tracking

**AI Chat Assistant**
- Natural language query interface for procurement data
- Streaming responses with real-time updates
- Context-aware responses with domain expertise
- Chat history persistence and session management
- Multiple conversation support

**Data Catalog**
- Comprehensive data source registry
- Table-level metadata and lineage information
- Column schemas with classification levels
- Data ownership and governance tracking
- Update frequency and sync status monitoring

**Dashboard & Analytics**
- Executive metrics overview ($52.3M spend, 1,247 suppliers)
- Quick-start onboarding flow for new users
- Status indicators for pending insights and approvals
- Navigation to key platform features

## External Dependencies

### Third-Party Services

**Authentication**
- Clerk (via @clerk/nextjs) - Complete authentication and user management solution
- Environment variable required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**AI & ML Services**
- OpenAI GPT-4o (via @ai-sdk/openai) - AI chat and analysis capabilities
- Vercel AI SDK (ai package) - Streaming responses and AI utilities
- Zod for schema validation and type safety

**Storage & Infrastructure**
- Vercel Blob (@vercel/blob) - Chat history and file storage
- Environment variable required: `BLOB_READ_WRITE_TOKEN`
- Vercel platform for deployment and hosting

### UI & Component Libraries

**Radix UI Primitives**
- @radix-ui/react-accordion, react-alert-dialog, react-avatar
- @radix-ui/react-checkbox, react-dialog, react-dropdown-menu
- @radix-ui/react-label, react-popover, react-progress
- @radix-ui/react-scroll-area, react-select, react-separator
- @radix-ui/react-slot, react-switch, react-tabs
- @radix-ui/react-toast, react-tooltip

**Styling & Icons**
- Tailwind CSS with tailwindcss-animate for animations
- Lucide React for icon library
- class-variance-authority for component variants
- clsx and tailwind-merge for className utilities

**Data Visualization**
- Recharts (^2.13.3) - Charts and data visualization components

### Development Tools

**Type Safety & Validation**
- TypeScript with strict configuration
- Zod for runtime schema validation
- Next.js TypeScript plugin for enhanced IDE support

**Code Quality**
- ESLint with Next.js configuration
- PostCSS for CSS processing
- Prettier (implied by v0.app origin)

### Deployment & Infrastructure

**Vercel Platform**
- Automatic deployments from v0.app
- Serverless function execution for API routes
- Edge middleware for authentication
- Static asset optimization and CDN

**Build Configuration**
- Next.js 15 with App Router
- React Server Components enabled
- Incremental builds for performance
- TypeScript strict mode compilation