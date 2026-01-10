/**
 * 🔥 UNIFIED AUTHENTICATION CONTEXT (SHARED)
 * Single React context for all authentication needs across Backbone apps.
 *
 * Consumes the shared UnifiedFirebaseAuth service.
 */
import React, { ReactNode } from 'react';
import { UnifiedUser, LoginCredentials } from './UnifiedFirebaseAuth';
import { Auth, User as FirebaseUser } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
export interface UnifiedAuthContextType {
    user: UnifiedUser | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<UnifiedUser>;
    logout: () => Promise<void>;
    getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
    isTeamMember: () => boolean;
    isOrganizationOwner: () => boolean;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    getOrganizationId: () => string | null;
    hasMinimumHierarchy: (minLevel: number) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    canManageTeam: () => boolean;
    canAccessProject: (projectId: string) => boolean;
    canModifyProject: (projectId: string) => boolean;
}
export declare const useUnifiedAuth: () => UnifiedAuthContextType;
export interface UnifiedAuthProviderProps {
    children: ReactNode;
    auth?: Auth;
    firestore?: Firestore;
}
export declare const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps>;
