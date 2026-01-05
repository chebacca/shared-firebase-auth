/**
 * 🔥 UNIFIED FIREBASE AUTH SERVICE
 * 
 * Direct Firebase Auth implementation using shared-firebase-types.
 * Provides unified authentication interface for Backbone projects.
 */

import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getIdToken,
    getIdTokenResult,
    Auth
} from 'firebase/auth';
import {
    CustomClaims,
    UnifiedUser,
    AuthState,
    LoginCredentials,
    createUnifiedUser
} from 'shared-firebase-types';
import { Firestore, doc, getDoc } from 'firebase/firestore';

export class UnifiedFirebaseAuthService {
    private static instance: UnifiedFirebaseAuthService;
    private authState: AuthState = {
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    };
    private listeners: Array<(state: AuthState) => void> = [];
    private unsubscribeAuth: (() => void) | null = null;
    private isListenerInitialized: boolean = false;

    // Injected dependencies
    private authInstance: Auth | null = null;
    private firestoreInstance: Firestore | null = null;

    private constructor() {
        console.log('🔥 [SharedAuth] Service created');
        // Don't initialize immediately - wait for injection or global fallback
        this.deferredInitialize();
    }

    /**
     * Initialize with specific Firebase instances
     */
    public initialize(auth: Auth, firestore?: Firestore): void {
        console.log('🔥 [SharedAuth] Initializing with injected instances');
        this.authInstance = auth;
        if (firestore) {
            this.firestoreInstance = firestore;
        }

        // Re-initialize listener with new auth instance
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
            this.unsubscribeAuth = null;
            this.isListenerInitialized = false;
        }

        this.initializeAuthListener();
    }

    /**
     * Deferred initialization - waits for Firebase to be ready (via Globals if not injected)
     */
    private deferredInitialize(): void {
        // If instance already injected, don't wait for globals
        if (this.authInstance) {
            this.initializeAuthListener();
            return;
        }

        // Wait for Firebase to be ready before initializing auth listener
        if (typeof window !== 'undefined') {
            const checkFirebaseReady = () => {
                if (this.authInstance) return; // Injected took precedence

                if ((window as any).firebaseAuth) {
                    console.log('🔥 [SharedAuth] Found global firebaseAuth');
                    this.initializeAuthListener();
                } else {
                    // Retry after a short delay
                    setTimeout(checkFirebaseReady, 100);
                }
            };
            checkFirebaseReady();
        }
    }

    public static getInstance(): UnifiedFirebaseAuthService {
        if (!UnifiedFirebaseAuthService.instance) {
            console.log('🔥 [SharedAuth] Creating new singleton instance');
            UnifiedFirebaseAuthService.instance = new UnifiedFirebaseAuthService();
        }
        return UnifiedFirebaseAuthService.instance;
    }

    /**
     * Helper to get Auth instance (Injected > Global > Error)
     */
    private getAuth(): Auth {
        if (this.authInstance) return this.authInstance;

        // Fallback to global
        if (typeof window !== 'undefined' && (window as any).firebaseAuth) {
            return (window as any).firebaseAuth;
        }

        throw new Error('Firebase Auth not initialized. Call initialize(auth) or ensure global firebaseAuth exists.');
    }

    /**
     * Helper to get Firestore instance (Injected > Global > Optional)
     */
    private getFirestore(): Firestore | null {
        if (this.firestoreInstance) return this.firestoreInstance;

        // Fallback to global
        if (typeof window !== 'undefined' && ((window as any).firebaseFirestore || (window as any).firestoreDb)) {
            return (window as any).firebaseFirestore || (window as any).firestoreDb;
        }

        return null;
    }

    /**
     * Initialize Firebase Auth state listener
     */
    private async initializeAuthListener(): Promise<void> {
        if (this.isListenerInitialized) {
            return;
        }

        try {
            const auth = this.getAuth();

            this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
                // console.log('🔥 [SharedAuth] Firebase auth state changed:', firebaseUser?.email);

                if (firebaseUser) {
                    try {
                        const unifiedUser = await this.createUserFromFirebase(firebaseUser);

                        this.authState = {
                            user: unifiedUser,
                            firebaseUser: firebaseUser,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        };
                    } catch (error: any) {
                        console.error('Error creating unified user:', error);
                        this.authState = {
                            user: null,
                            firebaseUser: firebaseUser,
                            isAuthenticated: false,
                            isLoading: false,
                            error: error.message || 'Failed to create user'
                        };
                    }
                } else {
                    this.authState = {
                        user: null,
                        firebaseUser: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    };
                }

                // Notify all listeners
                this.notifyListeners();
            });

            this.isListenerInitialized = true;
        } catch (error) {
            // console.warn('Warning initializing auth listener (might be waiting for init):', error);
            this.authState.isLoading = false;
            this.authState.error = error instanceof Error ? error.message : 'Failed to initialize auth';
            this.notifyListeners();
        }
    }

    /**
     * Create UnifiedUser from Firebase User
     */
    private async createUserFromFirebase(firebaseUser: FirebaseUser): Promise<UnifiedUser> {
        try {
            // Get custom claims
            const tokenResult = await getIdTokenResult(firebaseUser);
            const claims = tokenResult.claims as CustomClaims;

            // Optionally get Firestore user data
            let firestoreData: Record<string, any> | undefined;
            try {
                const db = this.getFirestore();
                if (db) {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        firestoreData = userDoc.data();
                    }
                }
            } catch (error) {
                // Firestore data is optional
                console.warn('Could not fetch Firestore user data:', error);
            }

            // Create unified user
            return createUnifiedUser(firebaseUser, claims, firestoreData);
        } catch (error) {
            console.error('Error creating unified user:', error);
            throw error;
        }
    }

    /**
     * Notify all listeners of auth state change
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener({ ...this.authState });
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Login with email and password
     */
    public async login(credentials: LoginCredentials): Promise<UnifiedUser> {
        const auth = this.getAuth();

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                credentials.email,
                credentials.password
            );

            const unifiedUser = await this.createUserFromFirebase(userCredential.user);

            this.authState = {
                user: unifiedUser,
                firebaseUser: userCredential.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

            this.notifyListeners();
            return unifiedUser;
        } catch (error: any) {
            console.error('Login error:', error);
            this.authState.error = error.message || 'Login failed';
            this.notifyListeners();
            throw error;
        }
    }

    /**
     * Logout current user
     */
    public async logout(): Promise<void> {
        const auth = this.getAuth();
        try {
            await signOut(auth);
            this.authState = {
                user: null,
                firebaseUser: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };
            this.notifyListeners();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Get current authenticated user
     */
    public getCurrentUser(): UnifiedUser | null {
        return this.authState.user;
    }

    /**
     * Check if user is authenticated
     */
    public isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    /**
     * Get Firebase ID token
     */
    public async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
        const auth = this.getAuth();
        const user = auth.currentUser;
        if (!user) return null;

        try {
            return await getIdToken(user, forceRefresh);
        } catch (error) {
            console.error('Error getting ID token:', error);
            return null;
        }
    }

    /**
     * Get current auth state
     */
    public getAuthState(): AuthState {
        return { ...this.authState };
    }

    /**
     * Listen for authentication state changes
     */
    public onAuthStateChange(callback: (state: AuthState) => void): () => void {
        this.listeners.push(callback);

        // Immediately call with current state
        callback({ ...this.authState });

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // 🔥 HIERARCHY / PERMISSION HELPERS (Included in service for reusability without Context)

    public hasMinimumHierarchy(minLevel: number): boolean {
        const user = this.authState.user;
        if (!user) return false;
        return (user.effectiveHierarchy || 0) >= minLevel;
    }

    public hasAnyRole(roles: string[]): boolean {
        const user = this.authState.user;
        if (!user) return false;

        // Check primary role
        if (user.role && roles.includes(user.role)) return true;

        // Check app roles
        if (user.appRoles) {
            for (const role of Object.values(user.appRoles)) {
                if (roles.includes(role)) return true;
            }
        }

        return false;
    }

    public canManageTeam(): boolean {
        // Standard rule: Hierarchy >= 50 or ADMIN/owner roles
        const user = this.authState.user;
        if (!user) return false;

        if ((user.effectiveHierarchy || 0) >= 50) return true;

        const adminRoles = ['ADMIN', 'OWNER', 'MANAGER', 'SUPERADMIN'];
        if (adminRoles.includes(user.role)) return true;
        if (user.teamMemberRole && adminRoles.includes(user.teamMemberRole.toUpperCase())) return true;

        return false;
    }

    public canAccessProject(projectId: string): boolean {
        const user = this.authState.user;
        if (!user) return false;
        if (user.isOrganizationOwner) return true;

        // Check project access list
        if (user.projectAccess?.includes(projectId)) return true;

        return false;
    }

    public canModifyProject(projectId: string): boolean {
        // Todo: Implement granular project permission checks
        return this.canAccessProject(projectId) && this.hasMinimumHierarchy(30);
    }

    /**
     * Cleanup
     */
    public destroy(): void {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
            this.unsubscribeAuth = null;
        }
        this.listeners = [];
        this.authState = {
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        };
    }
}

// Export singleton instance
export const unifiedFirebaseAuth = UnifiedFirebaseAuthService.getInstance();

// Export class for testing or separate instances
export { UnifiedFirebaseAuthService as UnifiedFirebaseAuthServiceClass };

// Re-export types
export type { UnifiedUser, AuthState, LoginCredentials };

// Legacy exports
export const UnifiedFirebaseAuth = unifiedFirebaseAuth;
export default unifiedFirebaseAuth;
