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
    private offlineTokenRefreshTimer: ReturnType<typeof setInterval> | null = null;

    // Offline token cache key (renderer environments only)
    private static readonly OFFLINE_TOKEN_KEY = 'backbone_offline_id_token_v1';

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

            // 🔥 HUB SSO: Check if running in Hub and try to authenticate
            try {
                const { initializeAuthFromHub } = await import('shared-firebase-types');

                // Initialize auth from Hub returns HubAuthResult object
                const result = await initializeAuthFromHub(auth);

                if (result.authenticated) {
                    console.log('✅ [SharedAuth] Authenticated via Hub SSO!');
                    // The onAuthStateChanged listener below will pick up the auth state
                }
            } catch (hubError) {
                console.warn('[SharedAuth] Hub auth check failed (non-critical):', hubError);
            }

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
                    const [userDoc, teamMemberDoc] = await Promise.all([
                        getDoc(doc(db, 'users', firebaseUser.uid)),
                        getDoc(doc(db, 'teamMembers', firebaseUser.uid))
                    ]);

                    if (userDoc.exists()) {
                        firestoreData = userDoc.data();
                    } else {
                        firestoreData = {};
                    }

                    // Merge organizationId from teamMembers if present and not in userDoc
                    if (teamMemberDoc.exists()) {
                        const teamData = teamMemberDoc.data();
                        if (teamData?.organizationId && !firestoreData.organizationId) {
                            firestoreData.organizationId = teamData.organizationId;
                        }
                        // Also merge teamMemberRole if needed
                        if (teamData?.role && !firestoreData.teamMemberRole) {
                            firestoreData.teamMemberRole = teamData.role;
                        }
                    }
                }
            } catch (error) {
                // Firestore data is optional
                console.warn('Could not fetch Firestore user data:', error);
            }

            // Create unified user
            const unifiedUser = createUnifiedUser(firebaseUser, claims, firestoreData);

            // 🔥 HUB CONTEXT OVERRIDE WITH VALIDATION
            // If running in Hub, prioritize the Hub's selected context (Org/Project)
            // CRITICAL SECURITY: Validate Hub context against user's actual claims to prevent data leaks
            try {
                // Dynamic import to avoid circular dep issues
                const {
                    getHubOrganizationId,
                    getHubProjectId,
                    validateHubOrganizationId,
                    validateHubProjectId
                } = await import('shared-firebase-types');

                const hubOrgId = getHubOrganizationId();
                const hubProjectId = getHubProjectId();

                // Get user's actual organizationId from claims/Firestore (source of truth)
                const userClaimOrgId = claims.organizationId || firestoreData?.organizationId || 'standalone';

                // CRITICAL SECURITY CHECK: Validate Hub organizationId
                // Only override if Hub context matches user's actual organizationId
                if (hubOrgId && hubOrgId !== 'null' && hubOrgId !== 'undefined') {
                    const validatedOrgId = validateHubOrganizationId(userClaimOrgId);

                    if (validatedOrgId) {
                        console.log(`[SharedAuth] ✅ Hub organizationId validated: ${validatedOrgId}`);
                        unifiedUser.organizationId = validatedOrgId;
                    } else {
                        console.warn(`[SharedAuth] ⚠️ Hub organizationId rejected - using user's actual org`, {
                            hubOrgId,
                            userClaimOrgId,
                            reason: 'Mismatch or stale localStorage'
                        });
                        // Use user's actual organizationId instead of stale Hub context
                        unifiedUser.organizationId = userClaimOrgId;
                    }
                } else {
                    // No Hub context, use user's actual organizationId
                    unifiedUser.organizationId = userClaimOrgId;
                }

                // CRITICAL SECURITY CHECK: Validate Hub projectId
                // Only set if user has access to this project
                if (hubProjectId && hubProjectId !== 'null' && hubProjectId !== 'undefined') {
                    const validatedProjectId = validateHubProjectId(
                        claims.projectAccess,
                        claims.isOrganizationOwner || false
                    );

                    if (validatedProjectId) {
                        console.log(`[SharedAuth] ✅ Hub projectId validated: ${validatedProjectId}`);
                        unifiedUser.projectId = validatedProjectId;
                    } else {
                        console.warn(`[SharedAuth] ⚠️ Hub projectId rejected - user lacks access`, {
                            hubProjectId,
                            projectAccess: claims.projectAccess,
                            reason: 'User does not have access to this project'
                        });
                        // Don't set projectId - let user select a project they have access to
                    }
                }
            } catch (e) {
                console.warn('[SharedAuth] Failed to apply Hub context overrides:', e);
                // Fallback to user's claims without Hub override
                unifiedUser.organizationId = claims.organizationId || firestoreData?.organizationId || 'standalone';
            }


            return unifiedUser;
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
            const token = await getIdToken(user, forceRefresh);

            // Best-effort offline caching (safe no-op outside browser/Electron renderers)
            try {
                const tokenResult = await getIdTokenResult(user);
                const expiresAt = Date.parse(tokenResult.expirationTime);
                if (Number.isFinite(expiresAt)) {
                    this.storeTokenForOffline(token, expiresAt);
                }
            } catch {
                // ignore
            }

            return token;
        } catch (error) {
            console.error('Error getting ID token:', error);
            return null;
        }
    }

    /**
     * Store an ID token for offline use (renderer environments only).
     */
    public storeTokenForOffline(token: string, expiresAt: number): void {
        try {
            if (typeof window === 'undefined' || !window.localStorage) return;
            const payload = {
                token,
                expiresAt,
                storedAt: Date.now()
            };
            window.localStorage.setItem(UnifiedFirebaseAuthService.OFFLINE_TOKEN_KEY, JSON.stringify(payload));
        } catch {
            // ignore storage failures
        }
    }

    /**
     * Retrieve cached offline token if present and not expired.
     */
    public getStoredToken(): string | null {
        try {
            if (typeof window === 'undefined' || !window.localStorage) return null;
            const raw = window.localStorage.getItem(UnifiedFirebaseAuthService.OFFLINE_TOKEN_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { token?: string; expiresAt?: number };
            if (!parsed?.token || !parsed?.expiresAt) return null;
            if (Date.now() >= parsed.expiresAt) return null;
            return parsed.token;
        } catch {
            return null;
        }
    }

    /**
     * Check whether a cached offline token exists and is still valid.
     */
    public isStoredTokenValid(): boolean {
        return this.getStoredToken() !== null;
    }

    /**
     * Start a best-effort background refresh loop (renderer environments only).
     * Refreshes token when it's within the configured window of expiry.
     */
    public startTokenRefreshMonitor(refreshWindowSeconds: number = 300): void {
        try {
            if (this.offlineTokenRefreshTimer) return;
            if (typeof window === 'undefined') return;

            this.offlineTokenRefreshTimer = setInterval(async () => {
                try {
                    const auth = this.getAuth();
                    const user = auth.currentUser;
                    if (!user) return;

                    const tokenResult = await getIdTokenResult(user);
                    const expiresAt = Date.parse(tokenResult.expirationTime);
                    if (!Number.isFinite(expiresAt)) return;

                    const msRemaining = expiresAt - Date.now();
                    if (msRemaining <= refreshWindowSeconds * 1000) {
                        await this.getIdToken(true);
                    }
                } catch {
                    // ignore
                }
            }, 60_000); // check every minute
        } catch {
            // ignore
        }
    }

    public stopTokenRefreshMonitor(): void {
        if (this.offlineTokenRefreshTimer) {
            clearInterval(this.offlineTokenRefreshTimer);
            this.offlineTokenRefreshTimer = null;
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
