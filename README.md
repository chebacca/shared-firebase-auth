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

```bash
# Install dependencies
pnpm install

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

