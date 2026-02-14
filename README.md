# Warehouse Picking App

A modern warehouse picking application built with Next.js, featuring 3D pallet visualization and real-time task management.

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router (Routes/URLs)
│   ├── page.tsx                  # Homepage → "/"
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── picking/[orderId]/        # Dynamic picking route
│   │   └── page.tsx              # → "/picking/123"
│   └── settings/                 # Settings route
│       └── page.tsx              # → "/settings"
│
├── features/                     # Page Components (Business Logic)
│   ├── home-page.tsx             # Home page with order list
│   ├── picking-page.tsx          # Picking tasks with 3D viewer
│   └── settings-page.tsx         # Settings and device info
│
├── components/                   # UI Components
│   ├── navigation-bottom-bar.tsx # Bottom navigation bar
│   ├── viewer-pallet-3d.tsx      # 3D pallet visualization
│   ├── installer-pwa.tsx         # PWA installation
│   ├── provider-theme.tsx        # Theme management
│   └── ui/                       # Reusable UI components (13 essential)
│       ├── badge.tsx             # Status badges
│       ├── button.tsx            # Buttons
│       ├── card.tsx              # Cards
│       ├── input.tsx             # Text inputs
│       ├── separator.tsx         # Dividers
│       ├── sheet.tsx             # Side panels
│       ├── skeleton.tsx          # Loading placeholders
│       ├── switch.tsx            # Toggle switches
│       ├── toast.tsx             # Toast notifications
│       ├── toaster.tsx           # Toast container
│       ├── toggle.tsx            # Toggle buttons
│       ├── toggle-group.tsx      # Grouped toggles
│       └── tooltip.tsx           # Tooltips
│
├── lib/                          # Utilities & Helpers
│   ├── store.ts                  # Zustand state management
│   ├── utils.ts                  # Helper functions
│   ├── use-mobile.ts             # Mobile detection hook
│   ├── use-toast.ts              # Toast notifications
│   └── register-sw.ts            # Service worker
│
└── public/                       # Static Assets
    ├── manifest.json             # PWA manifest
    ├── mock-pallet-data.json     # 3D demo data
    └── sw.js                     # Service worker
```

## 🎯 Key Features

- **Order Management**: View and manage warehouse picking orders
- **3D Pallet Visualization**: Interactive 3D view of pallet items using Three.js
- **Task Tracking**: Step-by-step picking instructions with progress tracking
- **PWA Support**: Works offline as a Progressive Web App
- **Responsive Design**: Optimized for warehouse tablets and mobile devices
- **Dark/Light Theme**: Theme support for different warehouse environments

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **3D Graphics**: Three.js + React Three Fiber
- **State Management**: Zustand
- **Icons**: Lucide React

## 📝 How It Works

### Routing
- `app/` folder contains Next.js routing structure (file-based routing)
- Each `page.tsx` file imports its logic from `features/` folder
- Folder names define URLs:
  - `app/` → `/`
  - `app/settings/` → `/settings`
  - `app/picking/[orderId]/` → `/picking/any-id` (dynamic route)

### Page Components
- `features/` contains all page logic and business components
- Keeps routing (`app/`) separate from implementation (`features/`)
- Clear separation between routes and business logic

### UI Components
- `components/` contains only reusable UI components
- `components/ui/` has 13 essential base components from shadcn/ui
- Component names use prefixes: `navigation-`, `viewer-`, `installer-`, `provider-`
- Only includes components that are actively used in the app

### State Management
- `lib/store.ts` uses Zustand for global state
- Manages orders, tasks, and picking progress

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📱 PWA Features

The app includes Progressive Web App capabilities:
- Offline support via Service Worker
- App manifest for installation
- Optimized for tablet devices in warehouse environments

## 🎨 Customization

- **Theme**: Modify `app/globals.css` for colors and styles
- **UI Components**: All essential components in `components/ui/` (cleaned to 13 files)
- **Component Naming**: Descriptive prefixes (navigation-, viewer-, installer-, provider-)
- **Mock Data**: Update `public/mock-pallet-data.json` for 3D testing

## 📦 Project Organization

**Key Principles:**
- ✅ **Minimal Structure**: Only essential files and folders
- ✅ **Clear Naming**: Descriptive file names with prefixes
- ✅ **Separation of Concerns**: Routes, features, components, utilities clearly separated
- ✅ **No Duplication**: Single source of truth for each component
- ✅ **Production Ready**: Optimized for warehouse tablet deployment

---

**Version**: 0.1.0  
**Built with**: Next.js, TypeScript, Tailwind CSS
