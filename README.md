<<<<<<< HEAD
# Shared Firebase Auth

A shared authentication library for the BACKBONE ecosystem, providing unified Firebase authentication across all Backbone applications.

## Overview

Shared Firebase Auth is a TypeScript library that provides a consistent authentication interface for all Backbone projects. It wraps Firebase Authentication with a unified API that includes:

- **Unified User Model**: Consistent user object across all apps
- **React Context**: Ready-to-use React context for authentication state
- **Permission System**: Built-in hierarchy and role-based access control
- **Organization Support**: Multi-tenant organization isolation
- **Type Safety**: Full TypeScript support with shared types

## Features

- 🔐 **Unified Authentication**: Single authentication service for all Backbone apps
- ⚛️ **React Integration**: React Context and hooks for easy integration
- 🎯 **Type Safety**: Full TypeScript support with `shared-firebase-types`
- 🏢 **Organization Support**: Built-in multi-tenant organization isolation
- 🔑 **Permission System**: Hierarchy-based and role-based access control
- 🔄 **Real-time Updates**: Automatic auth state synchronization
- 🎨 **Flexible Initialization**: Support for injected or global Firebase instances

## Installation

### Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Firebase project configured
- `shared-firebase-types` package

### Setup
=======
# 🔥 Shared Firebase Authentication Library

## 📋 Overview

This library provides unified authentication services for all BACKBONE projects. It serves as the single source of truth for authentication across 6 different applications while maintaining backward compatibility.

## 🏗️ Architecture

```
shared-firebase-auth/
├── src/
│   ├── UnifiedAuthService.ts          # Core authentication service
│   ├── adapters/                      # Project-specific adapters
│   │   ├── DashboardAuthAdapter.ts    # Dashboard project adapter
│   │   ├── LicensingAuthAdapter.ts    # Licensing website adapter
│   │   ├── CallSheetAuthAdapter.ts    # Call sheet app adapter
│   │   └── EDLConverterAuthAdapter.ts # EDL converter adapter
│   └── index.ts                       # Main exports
├── package.json                       # Dependencies and scripts
└── tsconfig.json                      # TypeScript configuration
```

## 🚀 Quick Start

### Installation

```bash
# Add to your project's package.json
"shared-firebase-auth": "file:../shared-firebase-auth"

# Install dependencies
pnpm install
```

### Basic Usage

```typescript
// Import the appropriate adapter for your project
import { dashboardAuthAdapter } from 'shared-firebase-auth/src/adapters/DashboardAuthAdapter';
import { licensingAuthAdapter } from 'shared-firebase-auth/src/adapters/LicensingAuthAdapter';
import { callSheetAuthAdapter } from 'shared-firebase-auth/src/adapters/CallSheetAuthAdapter';
import { edlConverterAuthAdapter } from 'shared-firebase-auth/src/adapters/EDLConverterAuthAdapter';

// Use the adapter
const user = await adapter.login({ email, password });
const currentUser = adapter.getCurrentUser();
const isAuth = adapter.isAuthenticated();
const token = await adapter.getToken();
```

## 🔧 Available Adapters

### DashboardAuthAdapter

For the main Dashboard project (`_backbone.Pro.Full-v1.0/`).

```typescript
import { dashboardAuthAdapter } from 'shared-firebase-auth/src/adapters/DashboardAuthAdapter';

// Features
- Login/logout
- User management
- Role hierarchy system
- Project access control
```

### LicensingAuthAdapter

For the Licensing Website (`_backbone-licensing-website-v1.0/`).

```typescript
import { licensingAuthAdapter } from 'shared-firebase-auth/src/adapters/LicensingAuthAdapter';

// Features
- User registration/login
- License validation
- Organization management
- Team member roles
```

### CallSheetAuthAdapter

For the Call Sheet App (`_standalone-call-sheet-app-v1.0/`).

```typescript
import { callSheetAuthAdapter } from 'shared-firebase-auth/src/adapters/CallSheetAuthAdapter';

// Features
- Standalone user authentication
- Cross-app license checking
- License information retrieval
```

### EDLConverterAuthAdapter

For the EDL Converter (`_edl-converter-monorepo.standalone-v1.0/`).

```typescript
import { edlConverterAuthAdapter } from 'shared-firebase-auth/src/adapters/EDLConverterAuthAdapter';

// Features
- Enterprise user authentication
- EDL converter license validation
- Comprehensive license info
```

## 🔐 Core Features

### Unified User Model

```typescript
interface UnifiedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  isTeamMember: boolean;
  isOrganizationOwner: boolean;
  licenseType?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  firebaseUid: string;
  projectAccess?: string[];
  permissions?: string[];
  
  // Hierarchy System
  teamMemberRole?: string;
  dashboardRole?: string;
  teamMemberHierarchy?: number;
  dashboardHierarchy?: number;
  effectiveHierarchy?: number;
  
  // Application Flags
  isEDLConverter?: boolean;
  isCallSheetUser?: boolean;
  isStandaloneUser?: boolean;
  isParserBrainUser?: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### Authentication Methods

```typescript
// Login
const user = await adapter.login({ email, password });

// Logout
await adapter.logout();

// Get current user
const currentUser = adapter.getCurrentUser();

// Check authentication status
const isAuth = adapter.isAuthenticated();

// Get Firebase ID token
const token = await adapter.getToken();

// Listen for auth state changes
const unsubscribe = adapter.onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});
```

### License Validation

```typescript
// Check access to specific applications
const hasEDLAccess = await adapter.validateLicense?.('EDL_CONVERTER');
const hasCallSheetAccess = await adapter.validateLicense?.('CALL_SHEET');
const hasParserAccess = await adapter.validateLicense?.('PARSER_BRAIN');

// Get comprehensive license info
const licenseInfo = adapter.getLicenseInfo?.();
```

## 🔄 Backward Compatibility

### Legacy Service Support

The library maintains backward compatibility with existing authentication services:

- **jwtService** → Redirects to Firebase Auth via compatibility wrapper
- **teamMemberAuthService** → Wrapper around unified auth system
- **SimpleAuthService** → Compatibility layer for direct API calls

### Migration Strategy

1. **Phase 1**: Existing code continues to work (current state)
2. **Phase 2**: Gradually migrate to new adapters when convenient
3. **Phase 3**: Remove compatibility wrappers in future releases

## 🛠️ Development

### Building
>>>>>>> abf3a76b46afbb0e72ce6adafe2d2676dda979fe

```bash
# Install dependencies
pnpm install

<<<<<<< HEAD
# Type check
pnpm run type-check

# Build
pnpm run build
```

## Usage

### Basic Setup

```typescript
import { UnifiedAuthProvider } from 'shared-firebase-auth';
import { auth, firestore } from './firebase-config';

function App() {
  return (
    <UnifiedAuthProvider auth={auth} firestore={firestore}>
      <YourApp />
    </UnifiedAuthProvider>
  );
}
```

### Using the Hook

```typescript
import { useUnifiedAuth } from 'shared-firebase-auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useUnifiedAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <div>Welcome, {user?.email}!</div>;
}
```

### Service Usage (Without React)

```typescript
import { unifiedFirebaseAuth } from 'shared-firebase-auth';
import { auth, firestore } from './firebase-config';

// Initialize
unifiedFirebaseAuth.initialize(auth, firestore);

// Login
await unifiedFirebaseAuth.login({ email, password });

// Check authentication
const isAuth = unifiedFirebaseAuth.isAuthenticated();

// Get current user
const user = unifiedFirebaseAuth.getCurrentUser();

// Listen to auth state changes
const unsubscribe = unifiedFirebaseAuth.onAuthStateChange((state) => {
  console.log('Auth state:', state);
});
```

### Permission Checks

```typescript
const { hasMinimumHierarchy, canManageTeam, canAccessProject } = useUnifiedAuth();

// Check hierarchy level
if (hasMinimumHierarchy(50)) {
  // User has hierarchy >= 50
}

// Check team management
if (canManageTeam()) {
  // User can manage team members
}

// Check project access
if (canAccessProject('project-id')) {
  // User has access to this project
}
```

## Architecture

### Unified User Model

The library provides a `UnifiedUser` type that combines:
- Firebase Auth user data
- Custom claims (roles, permissions, organization)
- Firestore user document data
- Computed properties (hierarchy, access lists)

### Service Layer

`UnifiedFirebaseAuthService` is a singleton service that:
- Manages authentication state
- Handles Firebase Auth integration
- Provides permission checking methods
- Supports multiple listeners

### React Context

`UnifiedAuthProvider` wraps the service in a React Context:
- Provides auth state to all child components
- Handles initialization and cleanup
- Exposes convenient hooks and utilities

## Project Structure

```
shared-firebase-auth/
├── src/
│   ├── index.ts                    # Main exports
│   ├── UnifiedFirebaseAuth.ts      # Core authentication service
│   ├── UnifiedAuthContext.tsx      # React context and provider
│   └── useUnifiedAuth.ts           # React hook (re-exported from context)
├── package.json
├── tsconfig.json
└── README.md
```

## Exports

### Main Exports

```typescript
// Service
export { unifiedFirebaseAuth, UnifiedFirebaseAuthServiceClass };

// React Context
export { UnifiedAuthProvider, useUnifiedAuth };

// Types
export type { UnifiedUser, AuthState, LoginCredentials };
```

### Named Exports

```typescript
// Service only
import { unifiedFirebaseAuth } from 'shared-firebase-auth/service';

// Context only
import { UnifiedAuthProvider } from 'shared-firebase-auth/context';

// Hook only
import { useUnifiedAuth } from 'shared-firebase-auth/hook';
```

## Dependencies

### Peer Dependencies

- `firebase`: ^10.7.1
- `react`: ^18.2.0
- `react-dom`: ^18.2.0

### Direct Dependencies

- `shared-firebase-types`: Shared type definitions

## Integration with Backbone Apps

This library is used across all Backbone applications:

- **Dashboard** (`_backbone_production_workflow_system`)
- **Licensing** (`_backbone_licensing_website`)
- **Clip Show Pro** (`_backbone_clip_show_pro`)
- **Cue Sheet & Budget Tools** (`_backbone_cuesheet_budget_tools`)
- **Call Sheet** (`_backbone_standalone_call_sheet`)
- **Timecard Management** (`_backbone_timecard_management_system`)
- **IWM** (`_backbone_iwm`)
- **CNS** (`_backbone_cns`)

## Development

### Type Checking

```bash
pnpm run type-check
```

### Building

```bash
pnpm run build
```

This compiles TypeScript to JavaScript with type declarations.

## Security

- Organization-based data isolation
- Firebase Authentication required
- Secure token handling
- No sensitive data stored locally
- Custom claims for role-based access

## License

Private - Backbone Logic Inc.

## Related Projects

- [Shared Firebase Types](../shared-firebase-types/)
- [Shared Firebase Functions](../shared-firebase-functions/)
- [Dashboard](../_backbone_production_workflow_system/)
- [Licensing Website](../_backbone_licensing_website/)

## Documentation

For detailed integration information, see the main BACKBONE project documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Repository Pattern**: Based on BACKBONE v14.2 unified project structure

=======
# Build TypeScript
pnpm run build

# Type checking
pnpm run type-check

# Watch mode
pnpm run dev
```

### Testing

```bash
# Run comprehensive tests
cd ..
./test-unified-auth.sh

# Test specific adapter
pnpm tsc --noEmit --skipLibCheck src/adapters/DashboardAuthAdapter.ts
```

## 📚 Documentation

- [UNIFIED_AUTH_ARCHITECTURE_GUIDE.md](../UNIFIED_AUTH_ARCHITECTURE_GUIDE.md) - Complete architecture guide
- [UNIFIED_AUTH_QUICK_REFERENCE.md](../UNIFIED_AUTH_QUICK_REFERENCE.md) - Developer quick reference
- [UNIFIED_AUTH_MIGRATION_COMPLETE.md](../UNIFIED_AUTH_MIGRATION_COMPLETE.md) - Migration documentation

## 🔗 Related Libraries

- **shared-firebase-functions** - Backend Firebase Functions
- **shared-firebase-config** - Unified Firebase configuration
- **shared-firebase-rules** - Security rules and storage rules

## 🎯 Status

**✅ PRODUCTION READY**

- All 6 projects successfully migrated
- Comprehensive testing completed
- Backward compatibility maintained
- Zero breaking changes

---

*Version: 1.0.0*  
*Last Updated: October 2024*
>>>>>>> abf3a76b46afbb0e72ce6adafe2d2676dda979fe
