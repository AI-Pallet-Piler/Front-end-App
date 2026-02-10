# WarePick - Warehouse Picking PWA

Professional warehouse order picking instructions app built with Next.js 14+, optimized for industrial environments.

## Project Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout with PWA meta tags
│   ├── page.tsx                # Dashboard - list of picking tasks
│   ├── picking/
│   │   └── [orderId]/
│   │       └── page.tsx        # Order picking screen with task list
│   └── settings/
│       └── page.tsx            # Settings & device info
│
├── components/
│   ├── bottom-nav.tsx          # Sticky bottom navigation bar
│   ├── pwa-init.tsx            # PWA initialization component
│   └── ui/                     # shadcn/ui components
│
├── lib/
│   ├── store.ts                # Zustand store with mock data
│   ├── register-sw.ts          # Service worker registration
│   └── utils.ts                # Utility functions
│
└── public/
    ├── manifest.json           # PWA manifest
    └── sw.js                   # Service worker for offline support
```

## Features Implemented

### ✅ Dashboard (Home Screen)
- Large, touch-friendly order cards (min 56-64px buttons)
- Order number, customer, total lines/items display
- Progress tracking for in-progress orders
- "Start" / "Continue" buttons with clear CTAs
- Empty state when no tasks assigned

### ✅ Order Picking Screen
- Sequential pick task list with optimal ordering
- Extra large location codes (easy to read from distance)
- Product info: name, SKU, quantity
- Visual task sequence indicators
- "Mark as Picked" action buttons with vibration feedback
- Progress bar showing completion status
- Completed tasks section
- Sticky bottom action bar with "Finish Order" button

### ✅ Settings Screen
- Device information display
- High brightness mode toggle
- Placeholder for upcoming pallet building feature
- Help & Support access
- Switch User action

### ✅ PWA Features
- Installable on device home screen
- Offline-ready with service worker
- Portrait-optimized for tablets/handhelds
- Theme color for status bar
- App shortcuts for quick access

### ✅ UX Optimizations
- High contrast industrial theme (dark blue-gray + green accents)
- Extra large touch targets (56-64px minimum)
- Vibration feedback on pick confirmation
- Readable from 1-2 meters away
- Optimized for gloved hands
- Mobile-first, portrait layout

## Design System

### Color Palette
- **Primary**: Deep industrial blue (#2d3e50 approx)
- **Accent**: Vibrant green for actions/success
- **Warning**: Bright orange for alerts
- **Neutral**: Cool grays for backgrounds

### Typography
- **Font**: Geist (sans-serif) for clarity
- **Sizes**: Large text throughout (18px+ for body, 24-48px for key info)
- **Weight**: Bold for important information

### Touch Targets
- Buttons: 56-64px height minimum
- Generous padding and spacing
- Large interactive areas

## State Management

Using Zustand for simple, performant state:

```typescript
interface WarehouseStore {
  orders: Order[]
  activeOrderId: string | null
  setActiveOrder: (orderId: string | null) => void
  markTaskPicked: (orderId: string, taskId: string) => void
  completeOrder: (orderId: string) => void
}
```

## Mock Data

The app includes 3 mock orders with 3-8 pick tasks each:
- Order 1: 8 tasks, 124 items (pending)
- Order 2: 5 tasks, 67 items (in-progress)
- Order 3: 3 tasks, 45 items (pending)

Mock products include industrial parts: bearings, brackets, hoses, filters, connectors, etc.

## Device Support

Optimized for:
- Rugged tablets (8-10 inches)
- Zebra-style handheld devices
- iPads in industrial cases
- Smartphones (360-800px wide, portrait)

## Future Scope

- [ ] 3D pallet building visualization
- [ ] Real authentication/login
- [ ] Backend API integration
- [ ] Real-time task updates
- [ ] Barcode scanning
- [ ] Camera integration
- [ ] Advanced offline sync
- [ ] Multi-language support

## Usage

1. **Dashboard**: View all assigned picking tasks
2. **Start Order**: Tap any order card to begin picking
3. **Pick Tasks**: Follow the sequence, scan/pick items, mark as picked
4. **Finish**: Complete all tasks and tap "Finish Order"
5. **Settings**: Adjust display settings or switch user

## Development Notes

- Uses Next.js 16 App Router
- Tailwind CSS v4 for styling
- Zustand for state management
- PWA with service worker registration
- Mobile-first responsive design
- Optimized for portrait orientation

## Accessibility

- High contrast mode friendly
- Large, readable text
- Clear visual hierarchy
- Touch-optimized interactive elements
- Semantic HTML structure
