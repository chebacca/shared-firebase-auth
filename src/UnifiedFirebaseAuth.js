/**
 * 🔥 UNIFIED FIREBASE AUTH SERVICE
 *
 * Direct Firebase Auth implementation using shared-firebase-types.
 * Provides unified authentication interface for Backbone projects.
 */
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdToken, getIdTokenResult } from 'firebase/auth';
import { createUnifiedUser } from 'shared-firebase-types';
import { doc, getDoc } from 'firebase/firestore';
export class UnifiedFirebaseAuthService {
    constructor() {
        this.authState = {
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: true,
            error: null
        };
        this.listeners = [];
        this.unsubscribeAuth = null;
        this.isListenerInitialized = false;
        // Injected dependencies
        this.authInstance = null;
        this.firestoreInstance = null;
        console.log('🔥 [SharedAuth] Service created');
        // Don't initialize immediately - wait for injection or global fallback
        this.deferredInitialize();
    }
    /**
     * Initialize with specific Firebase instances
     */
    initialize(auth, firestore) {
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
    deferredInitialize() {
        // If instance already injected, don't wait for globals
        if (this.authInstance) {
            this.initializeAuthListener();
            return;
        }
        // Wait for Firebase to be ready before initializing auth listener
        if (typeof window !== 'undefined') {
            const checkFirebaseReady = () => {
                if (this.authInstance)
                    return; // Injected took precedence
                if (window.firebaseAuth) {
                    console.log('🔥 [SharedAuth] Found global firebaseAuth');
                    this.initializeAuthListener();
                }
                else {
                    // Retry after a short delay
                    setTimeout(checkFirebaseReady, 100);
                }
            };
            checkFirebaseReady();
        }
    }
    static getInstance() {
        if (!UnifiedFirebaseAuthService.instance) {
            console.log('🔥 [SharedAuth] Creating new singleton instance');
            UnifiedFirebaseAuthService.instance = new UnifiedFirebaseAuthService();
        }
        return UnifiedFirebaseAuthService.instance;
    }
    /**
     * Helper to get Auth instance (Injected > Global > Error)
     */
    getAuth() {
        if (this.authInstance)
            return this.authInstance;
        // Fallback to global
        if (typeof window !== 'undefined' && window.firebaseAuth) {
            return window.firebaseAuth;
        }
        throw new Error('Firebase Auth not initialized. Call initialize(auth) or ensure global firebaseAuth exists.');
    }
    /**
     * Helper to get Firestore instance (Injected > Global > Optional)
     */
    getFirestore() {
        if (this.firestoreInstance)
            return this.firestoreInstance;
        // Fallback to global
        if (typeof window !== 'undefined' && (window.firebaseFirestore || window.firestoreDb)) {
            return window.firebaseFirestore || window.firestoreDb;
        }
        return null;
    }
    /**
     * Initialize Firebase Auth state listener
     */
    async initializeAuthListener() {
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
            }
            catch (hubError) {
                console.warn('[SharedAuth] Hub auth check failed (non-critical):', hubError);
            }
            this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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
                    }
                    catch (error) {
                        console.error('Error creating unified user:', error);
                        this.authState = {
                            user: null,
                            firebaseUser: firebaseUser,
                            isAuthenticated: false,
                            isLoading: false,
                            error: error.message || 'Failed to create user'
                        };
                    }
                }
                else {
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
        }
        catch (error) {
            // console.warn('Warning initializing auth listener (might be waiting for init):', error);
            this.authState.isLoading = false;
            this.authState.error = error instanceof Error ? error.message : 'Failed to initialize auth';
            this.notifyListeners();
        }
    }
    /**
     * Create UnifiedUser from Firebase User
     */
    async createUserFromFirebase(firebaseUser) {
        try {
            // Get custom claims
            const tokenResult = await getIdTokenResult(firebaseUser);
            const claims = tokenResult.claims;
            // Optionally get Firestore user data
            let firestoreData;
            try {
                const db = this.getFirestore();
                if (db) {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        firestoreData = userDoc.data();
                    }
                }
            }
            catch (error) {
                // Firestore data is optional
                console.warn('Could not fetch Firestore user data:', error);
            }
            // Create unified user
            return createUnifiedUser(firebaseUser, claims, firestoreData);
        }
        catch (error) {
            console.error('Error creating unified user:', error);
            throw error;
        }
    }
    /**
     * Notify all listeners of auth state change
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener({ ...this.authState });
            }
            catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }
    /**
     * Login with email and password
     */
    async login(credentials) {
        const auth = this.getAuth();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
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
        }
        catch (error) {
            console.error('Login error:', error);
            this.authState.error = error.message || 'Login failed';
            this.notifyListeners();
            throw error;
        }
    }
    /**
     * Logout current user
     */
    async logout() {
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
        }
        catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.authState.user;
    }
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.authState.isAuthenticated;
    }
    /**
     * Get Firebase ID token
     */
    async getIdToken(forceRefresh = false) {
        const auth = this.getAuth();
        const user = auth.currentUser;
        if (!user)
            return null;
        try {
            return await getIdToken(user, forceRefresh);
        }
        catch (error) {
            console.error('Error getting ID token:', error);
            return null;
        }
    }
    /**
     * Get current auth state
     */
    getAuthState() {
        return { ...this.authState };
    }
    /**
     * Listen for authentication state changes
     */
    onAuthStateChange(callback) {
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
    hasMinimumHierarchy(minLevel) {
        const user = this.authState.user;
        if (!user)
            return false;
        return (user.effectiveHierarchy || 0) >= minLevel;
    }
    hasAnyRole(roles) {
        const user = this.authState.user;
        if (!user)
            return false;
        // Check primary role
        if (user.role && roles.includes(user.role))
            return true;
        // Check app roles
        if (user.appRoles) {
            for (const role of Object.values(user.appRoles)) {
                if (roles.includes(role))
                    return true;
            }
        }
        return false;
    }
    canManageTeam() {
        // Standard rule: Hierarchy >= 50 or ADMIN/owner roles
        const user = this.authState.user;
        if (!user)
            return false;
        if ((user.effectiveHierarchy || 0) >= 50)
            return true;
        const adminRoles = ['ADMIN', 'OWNER', 'MANAGER', 'SUPERADMIN'];
        if (adminRoles.includes(user.role))
            return true;
        if (user.teamMemberRole && adminRoles.includes(user.teamMemberRole.toUpperCase()))
            return true;
        return false;
    }
    canAccessProject(projectId) {
        const user = this.authState.user;
        if (!user)
            return false;
        if (user.isOrganizationOwner)
            return true;
        // Check project access list
        if (user.projectAccess?.includes(projectId))
            return true;
        return false;
    }
    canModifyProject(projectId) {
        // Todo: Implement granular project permission checks
        return this.canAccessProject(projectId) && this.hasMinimumHierarchy(30);
    }
    /**
     * Cleanup
     */
    destroy() {
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
// Legacy exports
export const UnifiedFirebaseAuth = unifiedFirebaseAuth;
export default unifiedFirebaseAuth;
//# sourceMappingURL=UnifiedFirebaseAuth.js.map