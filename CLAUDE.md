# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LabFlow is a comprehensive multi-tenant laboratory management system designed for clinical laboratories. The system includes web application, mobile apps (iOS/Android), and Chrome extension for EMR integration.

## CRITICAL TESTING POLICY - DO NOT WORK ON TESTING AUTOMATICALLY

### ABSOLUTE RULES:
1. **NEVER** work on testing unless explicitly requested by the user
2. **NEVER** create test files, test configurations, or testing infrastructure automatically
3. **NEVER** include testing tasks in development plans or todo lists
4. **NEVER** suggest or implement testing as part of feature development
5. **ONLY** work on testing when BOTH conditions are met:
   - A file named `testing-allowed-for-project.permissions.md` exists in the project
   - The user explicitly asks for testing (e.g., "create tests for my code")
6. **ALWAYS** focus exclusively on features, functionality, and core development tasks
7. **DO NOT** mention testing needs or missing tests when implementing features

## First complete development of whole project, web, mobile and extension. Focus only on features and functionality.

## Development Commands

### Initial Setup (When code is implemented)

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Testing commands - DO NOT USE unless explicitly requested
# yarn test (ONLY when testing-allowed-for-project.permissions.md exists)
# yarn test:ui (ONLY when testing-allowed-for-project.permissions.md exists)
# yarn test:coverage (ONLY when testing-allowed-for-project.permissions.md exists)
# yarn cypress:open (ONLY when testing-allowed-for-project.permissions.md exists)
# yarn cypress:run (ONLY when testing-allowed-for-project.permissions.md exists)

# Lint and format
yarn lint
yarn lint:fix
yarn format

# Type checking
yarn typecheck

# Build mobile apps
yarn cap:sync
yarn cap:build:android
yarn cap:build:ios
```

### Firebase Functions Development

```bash
cd functions
yarn install
yarn build
yarn serve
yarn deploy
```

## Architecture Overview

### Multi-Tenant Architecture

- Each tenant has isolated data with a unique prefix (e.g., "labflow*tenant1*")
- Collections, storage paths, and resources are prefixed for complete isolation
- Tenant configuration stored in root `tenants` collection

### Core Modules

1. **Authentication & User Management** - Multi-role system with biometric support
2. **Patient Management** - Patient records, demographics, medical history
3. **Test Management** - LOINC integration, test catalog, custom panels
4. **Sample Tracking** - Barcode/QR support, chain of custody
5. **Results Management** - Entry, validation, reporting with PDF generation
6. **Billing & Insurance** - Claims processing, payment tracking
7. **Inventory Management** - Reagent tracking, automatic reordering
8. **Quality Control** - QC runs, Levey-Jennings charts, Westgard rules
9. **Reports & Analytics** - Customizable reports, dashboards
10. **EMR Integration** - HL7/FHIR standards, Chrome extension
11. **Mobile Apps** - Patient, Phlebotomist, Clinician, Lab Staff apps
12. **Admin Panel** - System configuration, user management, audit logs

### Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand
- **API/Data**: React Query + Axios
- **Mobile**: Capacitor
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Testing**: Vitest + Cypress (DO NOT IMPLEMENT unless explicitly requested)

### Custom Packages Priority

Always prefer these custom packages developed by Ahsan:

- `capacitor-biometric-authentication` - Biometric auth
- `capacitor-firebase-kit` - Firebase integration
- `capacitor-auth-manager` - Authentication management
- `notification-kit` - Unified notifications
- `buildkit-ui` - UI components
- `ts-buildkit` - TypeScript utilities
- `react-buildkit` - React utilities
- `qrcode-studio` - QR code functionality
- `capacitor-native-update` - App updates
- `unified-tracking` - Analytics/tracking
- `unified-error-handling` - Error management

### Firebase Structure

- Collections follow pattern: `{projectPrefix}{collectionName}` (e.g., `labflow_patients`)
- Storage follows pattern: `{projectPrefix}/{module}/{subfolder}` (e.g., `labflow/patients/photos/`)
- Comprehensive security rules and composite indexes defined
- Cloud Functions for automated workflows

### Development Guidelines

1. **Use absolute imports** with path aliases (`@/` for src, `@/components/`, etc.)
2. **Component size**: Max 500 lines, create reusable components
3. **State management**: Use Zustand stores in `src/stores/`
4. **API calls**: Use React Query hooks in `src/hooks/`
5. **Styling**: Tailwind CSS with custom design system
6. **Testing**: DO NOT write tests unless explicitly requested
7. **Offline support**: Implement for all features using local SQL
8. **Security**: HIPAA compliance required, no sensitive data in logs

### Module Development Order

1. Foundation Setup (Vite, React, TypeScript, Tailwind)
2. Authentication & User Management
3. Core Data Models (Patient, Test, Sample)
4. Test & Sample Management
5. Results Management
6. Billing & Quality Control
7. Reports & Analytics
8. Mobile Apps
9. EMR Integration

### Key Files to Reference

- `LabFlow-Complete-Tech-Stack-and-NPM-Packages.md` - Full package list
- `LabFlow-Complete-Firebase-Database-Structure.md` - Database schema
- `LabFlow-Detailed-Module-Development-Plan.md` - Module specifications
- `Readme.md` - Project overview and implementation phases

### Important Notes

- Project is currently in planning phase, no code exists yet
- Follow HIPAA compliance requirements
- Implement comprehensive offline support
- Use latest package versions
- Create proper Firebase indexes and security rules
- Maintain high code quality with proper documentation

### Memories

- Initiated project planning and architecture design on [Current Date]
- Explored comprehensive multi-tenant laboratory management system requirements
- Identified key technology stack components for web, mobile, and extension development
- Began mapping out development guidelines and module implementation strategy
- DO NOT work on testing until explicitly asked by the user, never add/work on testing of any package or project automatically while planning other things