/**
 * 🔥 UNIFIED FIREBASE AUTH SERVICE
 *
 * Direct Firebase Auth implementation using shared-firebase-types.
 * Provides unified authentication interface for Backbone projects.
 */
import { Auth } from 'firebase/auth';
import { UnifiedUser, AuthState, LoginCredentials } from 'shared-firebase-types';
import { Firestore } from 'firebase/firestore';
export declare class UnifiedFirebaseAuthService {
    private static instance;
    private authState;
    private listeners;
    private unsubscribeAuth;
    private isListenerInitialized;
    private authInstance;
    private firestoreInstance;
    private constructor();
    /**
     * Initialize with specific Firebase instances
     */
    initialize(auth: Auth, firestore?: Firestore): void;
    /**
     * Deferred initialization - waits for Firebase to be ready (via Globals if not injected)
     */
    private deferredInitialize;
    static getInstance(): UnifiedFirebaseAuthService;
    /**
     * Helper to get Auth instance (Injected > Global > Error)
     */
    private getAuth;
    /**
     * Helper to get Firestore instance (Injected > Global > Optional)
     */
    private getFirestore;
    /**
     * Initialize Firebase Auth state listener
     */
    private initializeAuthListener;
    /**
     * Create UnifiedUser from Firebase User
     */
    private createUserFromFirebase;
    /**
     * Notify all listeners of auth state change
     */
    private notifyListeners;
    /**
     * Login with email and password
     */
    login(credentials: LoginCredentials): Promise<UnifiedUser>;
    /**
     * Logout current user
     */
    logout(): Promise<void>;
    /**
     * Get current authenticated user
     */
    getCurrentUser(): UnifiedUser | null;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get Firebase ID token
     */
    getIdToken(forceRefresh?: boolean): Promise<string | null>;
    /**
     * Get current auth state
     */
    getAuthState(): AuthState;
    /**
     * Listen for authentication state changes
     */
    onAuthStateChange(callback: (state: AuthState) => void): () => void;
    hasMinimumHierarchy(minLevel: number): boolean;
    hasAnyRole(roles: string[]): boolean;
    canManageTeam(): boolean;
    canAccessProject(projectId: string): boolean;
    canModifyProject(projectId: string): boolean;
    /**
     * Cleanup
     */
    destroy(): void;
}
export declare const unifiedFirebaseAuth: UnifiedFirebaseAuthService;
export { UnifiedFirebaseAuthService as UnifiedFirebaseAuthServiceClass };
export type { UnifiedUser, AuthState, LoginCredentials };
export declare const UnifiedFirebaseAuth: UnifiedFirebaseAuthService;
export default unifiedFirebaseAuth;
