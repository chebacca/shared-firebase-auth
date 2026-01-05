/**
 * 🔥 UNIFIED AUTHENTICATION CONTEXT (SHARED)
 * Single React context for all authentication needs across Backbone apps.
 * 
 * Consumes the shared UnifiedFirebaseAuth service.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { unifiedFirebaseAuth, UnifiedUser, AuthState, LoginCredentials } from './UnifiedFirebaseAuth';
import { Auth, User as FirebaseUser } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// Context Types
export interface UnifiedAuthContextType {
    // State
    user: UnifiedUser | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<UnifiedUser>;
    logout: () => Promise<void>;
    getIdToken: (forceRefresh?: boolean) => Promise<string | null>;

    // Utilities
    isTeamMember: () => boolean;
    isOrganizationOwner: () => boolean;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    getOrganizationId: () => string | null;

    // 🔥 HIERARCHY SYSTEM METHODS
    hasMinimumHierarchy: (minLevel: number) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    canManageTeam: () => boolean;
    canAccessProject: (projectId: string) => boolean;
    canModifyProject: (projectId: string) => boolean;
}

// Create Context
const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null);

// Hook to use the context
export const useUnifiedAuth = (): UnifiedAuthContextType => {
    const context = useContext(UnifiedAuthContext);
    if (!context) {
        throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
    }
    return context;
};

// Provider Props
export interface UnifiedAuthProviderProps {
    children: ReactNode;
    auth?: Auth;
    firestore?: Firestore;
}

// Provider Component
export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children, auth, firestore }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    });

    // Initialize service if dependencies provided
    useEffect(() => {
        if (auth) {
            unifiedFirebaseAuth.initialize(auth, firestore);
        }
    }, [auth, firestore]);

    // Subscribe to auth state changes
    useEffect(() => {
        console.log('🔥 [SharedAuthContext] Initializing auth state listener');

        const unsubscribe = unifiedFirebaseAuth.onAuthStateChange((newState) => {
            // 🔥 CRITICAL FIX: Prevent infinite loops by only updating when state actually changes
            setAuthState(prevState => {
                if (
                    prevState.isAuthenticated === newState.isAuthenticated &&
                    prevState.user?.email === newState.user?.email &&
                    prevState.isLoading === newState.isLoading &&
                    prevState.error === newState.error
                ) {
                    // State hasn't actually changed, don't trigger re-render
                    return prevState;
                }
                return newState;
            });
        });

        return () => {
            // console.log('🔥 [SharedAuthContext] Cleaning up auth state listener');
            unsubscribe();
        };
    }, []); // Empty dependency array to prevent re-initialization

    // Login function
    const login = async (credentials: LoginCredentials): Promise<UnifiedUser> => {
        try {
            console.log('🔥 [SharedAuthContext] Login attempt for:', credentials.email);
            const user = await unifiedFirebaseAuth.login(credentials);
            console.log('✅ [SharedAuthContext] Login successful:', user.email);
            return user;
        } catch (error) {
            console.error('❌ [SharedAuthContext] Login failed:', error);
            throw error;
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            console.log('🔥 [SharedAuthContext] Logout attempt');

            // 🔥 CONTEXT PERSISTENCE: Clear all persistence keys on logout (common ones)
            // Apps can add their own cleanup via their own listeners if needed
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('last-project-id');
                localStorage.removeItem('selected_project');
                localStorage.removeItem('currentProjectId');
                localStorage.removeItem('selected_project_id');
                localStorage.removeItem('organizationId');
                localStorage.removeItem('current_user');
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('backbone-last-route');
            }

            await unifiedFirebaseAuth.logout();

            // Dispatch legacy auth:logout event for apps that rely on it
            window.dispatchEvent(new CustomEvent('auth:logout'));

            console.log('✅ [SharedAuthContext] Logout successful');
        } catch (error) {
            console.error('❌ [SharedAuthContext] Logout failed:', error);
            throw error;
        }
    };

    // Get ID token
    const getIdToken = async (forceRefresh = false): Promise<string | null> => {
        return await unifiedFirebaseAuth.getIdToken(forceRefresh);
    };

    // Utility functions
    const isTeamMember = (): boolean => {
        return authState.user?.isTeamMember || false;
    };

    const isOrganizationOwner = (): boolean => {
        return authState.user?.isOrganizationOwner || false;
    };

    const hasRole = (role: string): boolean => {
        return authState.user?.role === role;
    };

    const hasPermission = (permission: string): boolean => {
        return authState.user?.permissions?.includes(permission) || false;
    };

    const getOrganizationId = (): string | null => {
        return authState.user?.organizationId || null;
    };

    // 🔥 HIERARCHY SYSTEM METHODS DELEGATION
    const hasMinimumHierarchy = (minLevel: number): boolean => {
        return unifiedFirebaseAuth.hasMinimumHierarchy(minLevel);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return unifiedFirebaseAuth.hasAnyRole(roles);
    };

    const canManageTeam = (): boolean => {
        return unifiedFirebaseAuth.canManageTeam();
    };

    const canAccessProject = (projectId: string): boolean => {
        return unifiedFirebaseAuth.canAccessProject(projectId);
    };

    const canModifyProject = (projectId: string): boolean => {
        return unifiedFirebaseAuth.canModifyProject(projectId);
    };

    // Context value
    const contextValue: UnifiedAuthContextType = {
        // State
        user: authState.user,
        firebaseUser: authState.firebaseUser,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        error: authState.error,

        // Actions
        login,
        logout,
        getIdToken,

        // Utilities
        isTeamMember,
        isOrganizationOwner,
        hasRole,
        hasPermission,
        getOrganizationId,

        // 🔥 HIERARCHY SYSTEM METHODS
        hasMinimumHierarchy,
        hasAnyRole,
        canManageTeam,
        canAccessProject,
        canModifyProject
    };

    return (
        <UnifiedAuthContext.Provider value={contextValue}>
            {children}
        </UnifiedAuthContext.Provider>
    );
};
