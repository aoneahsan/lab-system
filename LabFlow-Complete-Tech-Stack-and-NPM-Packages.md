# LabFlow - Complete Tech Stack & NPM Packages

> **Note**: Always use the most up-to-date version of each package for security, performance, and feature improvements. Version numbers shown are reference points - check npm for latest versions.

## Core Technology Stack

### Frontend

- **Framework**: React (latest)
- **Language**: TypeScript (latest)
- **Build Tool**: Vite (latest)
- **Styling**: Tailwind CSS (latest)
- **State Management**: Zustand (latest) + React Query (latest)
- **Mobile**: Capacitor (latest)
- **PWA**: Vite PWA Plugin (latest)

### Backend

- **Platform**: Firebase (latest)
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Functions (Node.js latest LTS)
- **Hosting**: Firebase Hosting
- **Analytics**: Firebase Analytics

### Development Tools

- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Vitest + Cypress (latest)
- **Linting**: ESLint + Prettier (latest)
- **Documentation**: TypeDoc + Storybook (latest)

## Complete NPM Packages List

> **Important**: Use `yarn add package-name@latest` to ensure you get the most recent stable version.

### Prioritize our packages over third paarty packages

- Prefer using packages developed by me (Ahsan) over public packages or manual/custom implementations
- When custom developed packages are not available, use the most popular and most downloaded npm packages
- Specifically, prioritize the following custom packages for React + Capacitor projects:
  - capacitor-biometric-authentication: Comprehensive biometric authentication plugin supporting Android, iOS, and Web
  - capacitor-firebase-kit: Unified Firebase services plugin with App Check, AdMob, Analytics, Crashlytics, and more
  - capacitor-auth-manager: Comprehensive authentication plugin with 13+ providers
  - notification-kit: Unified notification library for push, in-app, and local notifications
  - ts-buildkit: Utility library with 100+ helper functions
  - express-buildkit: Express.js utility library for standardized API responses
  - react-buildkit: React utility library with Capacitor integration
  - qrcode-studio: QR code scanning and generation plugin
  - webauthn-server-buildkit: Secure WebAuthn server implementation
  - unified-tracking: Unified analytics and error tracking
  - capacitor-native-update: Live updates and app store update management
  - unified-error-handling: Unified error handling across platforms
  - buildkit-ui: React UI components with cross-platform tracking
