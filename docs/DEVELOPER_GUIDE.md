# LabFlow Developer Guide

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run type checking
yarn typecheck

# Run linting
yarn lint
```

## Module Overview

### 1. Inventory Management (`/inventory`)
Manages laboratory supplies, reagents, and consumables.
- **Key Features**: Stock tracking, purchase orders, expiry alerts
- **Main Component**: `src/pages/inventory/InventoryDashboard.tsx`
- **Mock Data**: Built-in for demonstration

### 2. Quality Control (`/quality-control`)
Implements QC procedures with Westgard rules.
- **Key Features**: QC runs, Levey-Jennings charts, rule validation
- **Main Component**: `src/pages/quality-control/QualityControlDashboard.tsx`
- **Business Logic**: `src/components/quality-control/WestgardRules.tsx`

### 3. Order Management (`/orders`)
Handles test ordering and tracking.
- **Key Features**: Order creation, barcode generation, status tracking
- **Main Component**: `src/pages/orders/OrderDashboard.tsx`
- **Barcode Library**: JsBarcode (Code128 format)

### 4. Sample Management (`/samples`)
Tracks samples from collection to disposal.
- **Key Features**: Registration, chain of custody, storage management
- **Main Component**: `src/pages/samples/SampleDashboard.tsx`
- **Storage Zones**: Room temp, refrigerated, frozen, ultra-frozen

### 5. Result Management (`/results`)
Handles result entry, validation, and review.
- **Key Features**: Result entry, validation rules, verification workflow
- **Main Component**: `src/pages/results/ResultDashboard.tsx`
- **Services**: `src/services/result.service.ts`
- **Store**: `src/stores/result.store.ts`

### 6. Reporting (`/reports`)
Manages report templates and generation.
- **Key Features**: Template management, multi-format support
- **Main Component**: `src/pages/reports/ReportDashboard.tsx`
- **Formats**: PDF, Excel, CSV, HTML

## Key Technologies

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for data fetching
- **React Router** for navigation

### Mobile Development
- **Capacitor** for cross-platform mobile apps
- Three separate mobile apps:
  - Patient App (`src/mobile/PatientApp.tsx`)
  - Phlebotomist App (`src/mobile/PhlebotomistApp.tsx`)
  - Lab Staff App (`src/mobile/LabStaffApp.tsx`)

### Backend (Ready for Integration)
- **Firebase** structure defined
- Multi-tenant architecture
- Collection prefixing for data isolation

## Code Organization

```
src/
├── components/      # Reusable UI components
├── pages/          # Page-level components
├── mobile/         # Mobile app components
├── services/       # API/Firebase services
├── stores/         # Zustand state stores
├── types/          # TypeScript type definitions
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── routes/         # Routing configuration
```

## Development Patterns

### Component Structure
```tsx
// Standard component pattern
export default function ComponentName() {
  // State management
  const [state, setState] = useState();
  
  // Store access
  const { data, actions } = useStore();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
}
```

### Store Pattern (Zustand)
```tsx
export const useModuleStore = create<ModuleStore>((set, get) => ({
  // State
  items: [],
  loading: false,
  
  // Actions
  fetchItems: async () => {
    set({ loading: true });
    // Fetch logic
    set({ items: data, loading: false });
  },
}));
```

### Type Definitions
```tsx
// Always define comprehensive types
export interface ModuleItem {
  id: string;
  tenantId: string;
  // ... other fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Adding New Features

### 1. Create Types
Define TypeScript interfaces in `src/types/`

### 2. Create Service
Add Firebase/API logic in `src/services/`

### 3. Create Store
Add Zustand store in `src/stores/`

### 4. Create Components
Build UI components in `src/components/`

### 5. Create Page
Add page component in `src/pages/`

### 6. Update Routes
Add route in `src/routes/AppRouter.tsx`

## Testing Guidelines

### Unit Tests (Vitest)
```bash
yarn test
```

### E2E Tests (Cypress)
```bash
yarn cypress:open
```

## Deployment

### Web Build
```bash
yarn build
yarn preview
```

### Mobile Build
```bash
# Sync web assets to mobile
yarn cap:sync

# Build Android
yarn cap:build:android

# Build iOS
yarn cap:build:ios
```

## Common Issues & Solutions

### TypeScript Errors
Run `yarn typecheck` to identify type issues

### Build Failures
1. Clear cache: `rm -rf node_modules/.vite`
2. Reinstall deps: `yarn install`
3. Rebuild: `yarn build`

### Mobile Issues
1. Sync capacitor: `yarn cap:sync`
2. Check native logs in Android Studio/Xcode

## Best Practices

1. **Always use TypeScript** - No `any` types
2. **Follow component patterns** - Consistency is key
3. **Use absolute imports** - `@/components/...`
4. **Keep components small** - Max 500 lines
5. **Document complex logic** - Add inline comments
6. **Test critical paths** - Especially validation logic
7. **Handle errors gracefully** - User-friendly messages
8. **Optimize performance** - Use lazy loading

## Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Firebase](https://firebase.google.com/docs)
- [Capacitor](https://capacitorjs.com/docs)