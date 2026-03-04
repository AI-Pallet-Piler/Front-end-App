# WarePick - Warehouse Picking App

A professional warehouse order picking mobile application built with Next.js 16, featuring real-time 3D pallet visualization, warehouse navigation, and integration with the AI Pallet Piler backend system.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Pages & Features](#pages--features)
- [Components](#components)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [PWA Support](#pwa-support)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Development](#development)

---

## Overview

**WarePick** is a mobile-first Progressive Web App (PWA) designed for warehouse picker operators. It provides:

- A streamlined interface for viewing and executing picking orders
- Real-time 3D visualization of pallet stacking instructions (powered by AI Pallet Piler algorithm)
- Interactive warehouse floor navigation with optimized routing
- Issue reporting and tracking system
- Seamless integration with the backend API gateway

The app is optimized for tablet devices used in warehouse environments with support for both light and dark themes.

---

## Features

| Feature | Description |
|---------|-------------|
| **Order Dashboard** | View all orders with status indicators (pending, in-progress, completed) |
| **3D Pallet Visualization** | Interactive Three.js viewer showing exact item placement on pallets |
| **Warehouse Navigation** | SVG-based floor plan with real-time route guidance using Dijkstra pathfinding |
| **Swipe-to-Confirm** | Touch-friendly gesture to confirm item picks |
| **Issue Reporting** | Report damaged, missing, or blocked items with categorization |
| **Badge Authentication** | Login via warehouse badge number with JWT token management |
| **PWA Installation** | Install as native app on mobile/tablet devices |
| **Offline Support** | Service worker for caching and offline operation |
| **Dark/Light Theme** | Automatic theme switching based on device preference |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Runtime** | React 19 |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui + Radix UI primitives |
| **3D Graphics** | Three.js + React Three Fiber + Drei |
| **State Management** | Zustand (with persist middleware) |
| **HTTP Client** | Native Fetch API |
| **Icons** | Lucide React |
| **Date Utilities** | date-fns |
| **Package Manager** | pnpm |
| **Container** | Docker (Node 22 Alpine) |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
cd Front-end-App

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Project Structure

```
Front-end-App/
├── app/                              # Next.js App Router (routes)
│   ├── layout.tsx                    # Root layout with PWA metadata
│   ├── page.tsx                      # Home page → "/"
│   ├── globals.css                   # Global styles & Tailwind
│   ├── login/
│   │   └── page.tsx                  # Login page → "/login"
│   ├── picking/
│   │   ├── page.tsx                  # No active order → "/picking"
│   │   └── [orderId]/
│   │       └── page.tsx              # Order picking → "/picking/:orderId"
│   ├── reports/
│   │   └── page.tsx                  # Reports page → "/reports"
│   └── settings/
│       └── page.tsx                  # Settings page → "/settings"
│
├── features/                         # Page-level business logic
│   ├── home-page.tsx                 # Order dashboard with stats
│   ├── picking-page.tsx              # Picking workflow with 3D viewer
│   ├── reports-page.tsx              # Issue reports management
│   └── settings-page.tsx             # User profile & preferences
│
├── components/                       # Reusable components
│   ├── bottom-nav.tsx                # Legacy bottom navigation
│   ├── navigation-bottom-bar.tsx     # Main bottom navigation bar
│   ├── viewer-pallet-3d.tsx          # Three.js pallet visualizer
│   ├── warehouse-route-navigator.tsx # SVG warehouse map navigation
│   ├── mock-warehouse-floorplan.tsx  # Warehouse floor plan SVG
│   ├── installer-pwa.tsx             # PWA install prompt
│   ├── provider-theme.tsx            # Theme context provider
│   └── ui/                           # shadcn/ui components
│       ├── alert.tsx                 # Alert messages
│       ├── badge.tsx                 # Status badges
│       ├── button.tsx                # Button variants
│       ├── card.tsx                  # Card containers
│       ├── dialog.tsx                # Modal dialogs
│       ├── input.tsx                 # Text inputs
│       ├── label.tsx                 # Form labels
│       ├── separator.tsx             # Visual dividers
│       ├── sheet.tsx                 # Slide-out panels
│       ├── skeleton.tsx              # Loading placeholders
│       ├── swipe-to-confirm.tsx      # Swipe gesture component
│       ├── switch.tsx                # Toggle switches
│       ├── toast.tsx                 # Toast notifications
│       ├── toaster.tsx               # Toast container
│       ├── toggle.tsx                # Toggle buttons
│       ├── toggle-group.tsx          # Grouped toggles
│       └── tooltip.tsx               # Tooltips
│
├── lib/                              # Utilities & services
│   ├── api.ts                        # Backend API client (423 lines)
│   ├── store.ts                      # Zustand state store (346 lines)
│   ├── warehouse-nav.ts              # Warehouse coordinate transforms
│   ├── warehouse-routing.ts          # Path routing with caching
│   ├── utils.ts                      # Helper functions (cn, etc.)
│   ├── use-mobile.ts                 # Mobile detection hook
│   ├── use-toast.ts                  # Toast notification hook
│   └── register-sw.ts                # Service worker registration
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   ├── mock-pallet-data.json         # Demo pallet data
│   └── sw.js                         # Service worker
│
├── Dockerfile                        # Docker configuration
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── components.json                   # shadcn/ui configuration
└── package.json                      # Dependencies & scripts
```

---

## Architecture

### Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Device                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    WarePick PWA                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │
│  │  │  Home   │  │ Picking │  │ Reports │  │Settings │     │  │
│  │  │  Page   │  │  Page   │  │  Page   │  │  Page   │     │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │  │
│  │       │            │            │            │           │  │
│  │       └────────────┴────────────┴────────────┘           │  │
│  │                         │                                 │  │
│  │              ┌──────────▼──────────┐                     │  │
│  │              │   Zustand Store     │                     │  │
│  │              │  (orders, reports)  │                     │  │
│  │              └──────────┬──────────┘                     │  │
│  │                         │                                 │  │
│  │              ┌──────────▼──────────┐                     │  │
│  │              │    API Client       │                     │  │
│  │              │    (lib/api.ts)     │                     │  │
│  │              └──────────┬──────────┘                     │  │
│  └─────────────────────────┼─────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API Gateway     │
                    │  (Port 8080)      │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│    Backend      │  │  Security API   │  │  Pallet Piler  │
│  (Orders, etc)  │  │ (Auth/JWT)      │  │  (Algorithm)   │
└─────────────────┘  └─────────────────┘  └────────────────┘
```

### Data Flow

1. **Authentication**: User logs in with badge → Security API returns JWT
2. **Order Loading**: Home page fetches orders via API Gateway
3. **Picking**: User starts order → status updated → tasks loaded
4. **3D Visualization**: Pallet instructions fetched from Pallet Piler algorithm
5. **Navigation**: Warehouse map & routes fetched from navigation API
6. **Completion**: Order marked complete → synced to backend

---

## Pages & Features

### 1. Login Page (`/login`)

**File**: `app/login/page.tsx`

- Badge-based authentication
- Supports auto-login via URL parameters (`?badge=1234&auto=true`)
- JWT token storage in localStorage
- Error handling with visual feedback

**Authentication Flow**:
```
Badge Input → POST /auth/login-badge → JWT Token → localStorage → Redirect to Home
```

### 2. Home Page (`/`)

**File**: `features/home-page.tsx`

- Displays order dashboard with statistics
- Orders grouped by status: In Progress, Pending, Completed Today
- Priority-based sorting for pending orders
- Start/Continue order actions
- Pull-to-refresh functionality

**Order Card Information**:
- Order number & customer name
- Progress bar (picked items / total items)
- Estimated pallet count
- Priority indicator
- Time since created

### 3. Picking Page (`/picking/:orderId`)

**File**: `features/picking-page.tsx`

- Step-by-step picking instructions
- **3D Pallet Viewer**: Shows where to place each item
- **Warehouse Navigator**: SVG map with route to next location
- Swipe-to-confirm for each pick
- Issue reporting modal
- Order completion workflow

**Picking Task Attributes**:
- Location code (e.g., "A-01-02")
- Product name & SKU
- Quantity to pick
- Sequence number (optimized route order)

### 4. Reports Page (`/reports`)

**File**: `features/reports-page.tsx`

- View all submitted issue reports
- Create new reports (even without active order)
- Report types: Missing, Damaged, Blocked, Other
- Chronological sorting with relative timestamps

### 5. Settings Page (`/settings`)

**File**: `features/settings-page.tsx`

- User profile display (name, badge, zone)
- Today's performance statistics
- Notification preferences toggle
- Sign out functionality
- App version info

---

## Components

### Core Components

#### `viewer-pallet-3d.tsx`

3D visualization of pallet stacking using React Three Fiber.

**Features**:
- Renders boxes based on AI-calculated positions
- Color-coded by product type
- Highlighted flashing for current item
- Grayed-out styling for already-picked items
- Interactive camera controls (orbit, zoom)
- Pallet base with grid overlay

**Props**:
```typescript
interface PalletViewerProps {
  palletData: PalletData | null
  highlightedItemId?: string
  highlightedProductName?: string
  pickedProductNames?: string[]
}
```

#### `warehouse-route-navigator.tsx`

SVG-based warehouse floor plan with navigation.

**Features**:
- Fetches warehouse map data from API
- Displays locations as interactive points
- Draws route polylines between stops
- Current location indicator
- Auto-scrolls to active location
- Caches path data for performance

#### `navigation-bottom-bar.tsx`

Mobile-style bottom navigation bar.

**Tabs**:
- **Home**: Order dashboard
- **Active Order**: Current picking task
- **Reports**: Issue reports
- **Settings**: User preferences

#### `swipe-to-confirm.tsx`

Touch-friendly swipe gesture component for confirming picks.

**Features**:
- Visual slider with progress indicator
- Haptic feedback on completion
- Customizable threshold and styling

---

## State Management

### Zustand Store (`lib/store.ts`)

Global state management with persistence.

**State Shape**:
```typescript
interface WarehouseStore {
  // Orders
  orders: Order[]
  activeOrderId: string | null
  isLoading: boolean
  error: string | null
  
  // Reports
  reports: IssueReport[]
  isLoadingReports: boolean
  
  // Actions
  setActiveOrder: (orderId: string | null) => void
  startOrder: (orderId: string) => Promise<void>
  markTaskPicked: (orderId: string, taskId: string) => Promise<void>
  completeOrder: (orderId: string) => Promise<void>
  loadOrders: () => Promise<void>
  loadReports: () => Promise<void>
  addReport: (report: Omit<IssueReport, 'id' | 'createdAt'>) => Promise<void>
}
```

**Order Interface**:
```typescript
interface Order {
  id: string
  orderNumber: string
  customer: string
  priority: number
  totalLines: number
  totalItems: number
  pickedItems: number
  tasks: PickTask[]
  status: 'pending' | 'in-progress' | 'completed'
  completedAt: string | null
}
```

**PickTask Interface**:
```typescript
interface PickTask {
  id: string
  location: string
  productName: string
  sku: string
  quantity: number
  status: 'pending' | 'picked'
  sequence: number
  orderLineId: number
}
```

---

## API Integration

### API Client (`lib/api.ts`)

Centralized API communication with the backend gateway.

**Base URL**: `NEXT_PUBLIC_API_URL` or `http://localhost:8080/api/v1`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/orders` | Fetch all orders |
| `GET` | `/orders/:id` | Fetch single order |
| `PUT` | `/orders/:id/status` | Update order status |
| `PUT` | `/orders/:id/lines/:lineId/picked` | Mark line as picked |
| `GET` | `/inventory/sku/:sku` | Get inventory by SKU |
| `GET` | `/reports` | Fetch all reports |
| `POST` | `/reports` | Create new report |
| `GET` | `/pallet-instructions/:orderId` | Get 3D pallet data |
| `GET` | `/navigation/warehouse-map` | Get warehouse floor plan |
| `GET` | `/navigation/locations` | Get all locations |
| `GET` | `/navigation/path/code/:from/:to` | Get route between locations |
| `POST` | `/auth/login-badge` | Authenticate with badge |

### API Types

```typescript
interface ApiOrder {
  order_id: number
  order_number: string
  customer_name: string
  status: string
  priority: number
  created_at: string
  completed_at: string | null
  promised_ship_date: string
  order_lines: ApiOrderLine[]
}

interface ApiOrderLine {
  order_line_id: number
  product_id: number
  quantity_ordered: number
  quantity_picked: number
  product_name: string
  product_sku: string
}

interface PalletData {
  pallet_id: number
  items: PalletItem[]
}

interface PalletItem {
  id: string
  name: string
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  weight: number
  tipped: boolean
}
```

---

## Authentication

### Badge-Based Login

The app uses warehouse badge numbers for authentication:

1. User enters badge number on login screen
2. App sends `POST /auth/login-badge` with badge number
3. Security API validates and returns JWT tokens
4. Tokens stored in localStorage:
   - `access_token`: Short-lived access token
   - `refresh_token`: Long-lived refresh token
   - `pickerId`: Badge number for display

### Auto-Login

Supports deep-linking from web dashboard:
```
/login?badge=4782&auto=true
```

This automatically authenticates without user input.

### Protected Routes

Home page checks for `access_token` on mount and redirects to `/login` if missing.

---

## PWA Support

### Manifest (`public/manifest.json`)

```json
{
  "name": "WarePick - Warehouse Picking System",
  "short_name": "WarePick",
  "description": "Professional warehouse order picking instructions app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2d3e50",
  "theme_color": "#2d3e50",
  "orientation": "portrait"
}
```

### Service Worker (`public/sw.js`)

- Caches static assets for offline access
- Network-first strategy for API calls
- Background sync for pending operations

### Installation Prompt

The `installer-pwa.tsx` component handles:
- Detecting installability
- Showing install prompt
- Handling user response

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]
```

### Build & Run

```bash
# Build image
docker build -t warepick-app .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://gateway:8080/api/v1 warepick-app
```

### Docker Compose Integration

The app integrates with the main `Architecture/compose.yaml`:

```yaml
services:
  frontend-app:
    build: ../Front-end-App
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api-gateway:8080/api/v1
    depends_on:
      - api-gateway
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API gateway URL | `http://localhost:8080/api/v1` |

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

### Adding UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/). Add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Code Style

- **Components**: PascalCase (`PickingPage.tsx`)
- **Utilities**: camelCase (`useToast.ts`)
- **Files**: kebab-case (`warehouse-routing.ts`)
- **Prefixes**: Descriptive (`viewer-`, `navigation-`, `provider-`)

### Testing

Manually test on tablet devices for:
- Touch responsiveness
- Swipe gestures
- 3D viewer performance
- Offline functionality

---

## Troubleshooting

### Common Issues

**API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Ensure API gateway is running
- Check CORS configuration

**3D Viewer Not Loading**
- Three.js requires WebGL support
- Check browser console for errors
- Verify pallet data format

**PWA Not Installing**
- HTTPS required for PWA installation
- Check manifest.json is accessible
- Verify service worker registration

**Authentication Redirect Loop**
- Clear localStorage tokens
- Check Security API is responding
- Verify badge number exists in database

---

## Contributing

1. Create a feature branch from `development`
2. Make changes following code style guidelines
3. Test on mobile/tablet devices
4. Submit pull request with description

---

## License

Part of the AI Pallet Piler project.

---

**Version**: 1.0.0  
**Built with**: Next.js 16, React 19, TypeScript, Tailwind CSS, Three.js
