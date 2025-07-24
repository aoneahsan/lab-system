# LabFlow Quick Start Guide

## Prerequisites

- Node.js 22+ (use `.nvmrc`)
- Yarn package manager
- Firebase project with Firestore enabled
- Git

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd labflow

# Use correct Node version
nvm use

# Install dependencies
yarn install
```

### 2. Environment Configuration

Create `.env.local` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Optional: Firebase Emulators
USE_FIREBASE_EMULATOR=false
```

### 3. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

## Development

### Start Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:5173`

### Create Demo Tenant

1. Navigate to `http://localhost:5173/setup-demo`
2. Click "Create Demo Tenant"
3. Register a new account with tenant code: `DEMO`

### Development Commands

```bash
# Run tests
yarn test

# Run linter
yarn lint

# Type checking
yarn typecheck

# Build for production
yarn build

# Preview production build
yarn preview
```

## Key Features to Test

### 1. Patient Registration
- Navigate to Patients > Add Patient
- Fill in patient demographics
- Save and view patient profile

### 2. Test Orders
- Go to Tests > Orders
- Create new test order
- Select patient and tests
- Submit for approval

### 3. Sample Collection
- Visit Samples > Collect Sample
- Select test order
- Generate barcode/QR code
- Print sample label

### 4. Result Entry
- Navigate to Results > Enter Result
- Select pending order
- Enter test values
- System validates automatically

### 5. Critical Results
- Enter a critical value (e.g., glucose < 40)
- See alert in results dashboard
- Complete physician notification

### 6. PDF Reports
- Go to Results page
- Click download icon on any result
- PDF generated with lab header

## Common Tasks

### Add New Test
1. Go to Tests > Test Catalog
2. Click "Add Test"
3. Fill in test details including:
   - Name and code
   - Department and category
   - Reference ranges
   - Sample requirements

### Configure Validation Rules
1. Navigate to Settings > Validation Rules
2. Select test to configure
3. Set normal and critical ranges
4. Save configuration

### Batch Sample Collection
1. Go to Samples > Collections
2. Click "New Collection Batch"
3. Add multiple patients/tests
4. Process all at once

## Troubleshooting

### Firebase Connection Issues
- Check `.env.local` configuration
- Verify Firebase project settings
- Ensure Firestore is enabled

### Login Problems
- Clear browser cache
- Check tenant code (case-sensitive)
- Verify user exists in Firebase Auth

### Missing Data
- Run seeders for demo data
- Check Firebase rules permissions
- Verify tenant prefix in collections

## Architecture Overview

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (routes)
├── hooks/         # Custom React hooks
├── services/      # Business logic services
├── stores/        # Zustand state stores
├── types/         # TypeScript definitions
├── utils/         # Utility functions
└── config/        # Configuration files
```

## Key Technologies

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Data Fetching**: React Query
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Mobile**: Capacitor
- **Testing**: Vitest + Cypress

## Next Steps

1. Review the [Results Management Guide](./features/RESULTS-MANAGEMENT.md)
2. Explore the codebase structure
3. Set up your development environment
4. Start with simple features first
5. Check existing components before creating new ones

## Support

- Check `CLAUDE.md` for AI assistance guidelines
- Review existing documentation in `/docs`
- Use TypeScript for type safety
- Follow existing code patterns

Happy coding! 🚀