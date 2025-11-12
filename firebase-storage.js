/**
 * Firebase Realtime Database Storage Module
 *
 * This module provides Firebase integration for the AI Tools Organizer.
 * It syncs data across devices and provides offline support.
 *
 * Setup:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Get your Firebase config from Project Settings
 * 3. Update FIREBASE_CONFIG below with your credentials
 * 4. Include Firebase SDK and this file in index.html
 * 5. Data will automatically sync across all devices!
 */

// Firebase Configuration
// Get this from your Firebase Console -> Project Settings -> Your apps -> SDK setup
const FIREBASE_CONFIG = {
    apiKey: "", // e.g., "AIzaSyA..."
    authDomain: "", // e.g., "your-project.firebaseapp.com"
    databaseURL: "", // e.g., "https://your-project.firebaseio.com"
    projectId: "", // e.g., "your-project"
    storageBucket: "", // e.g., "your-project.appspot.com"
    messagingSenderId: "", // e.g., "123456789"
    appId: "" // e.g., "1:123456789:web:abc123"
};

// Enable Firebase (set to false to use localStorage instead)
const ENABLE_FIREBASE = false;

/**
 * Firebase Storage Manager
 */
window.FirebaseStorage = {
    db: null,
    dataRef: null,
    initialized: false,
    cache: null,
    lastSyncTime: null,

    /**
     * Check if Firebase is enabled and configured
     */
    isEnabled() {
        return ENABLE_FIREBASE &&
               FIREBASE_CONFIG.apiKey &&
               typeof firebase !== 'undefined';
    },

    /**
     * Initialize Firebase
     */
    async initialize() {
        if (!this.isEnabled()) {
            console.log('Firebase not enabled, using localStorage');
            return false;
        }

        if (this.initialized) {
            return true;
        }

        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            // Get database reference
            this.db = firebase.database();
            this.dataRef = this.db.ref('ai-tools');

            // Enable offline persistence
            this.db.goOffline();
            this.db.goOnline();

            // Listen for realtime updates
            this.dataRef.on('value', (snapshot) => {
                const data = snapshot.val();
                this.cache = data ? JSON.parse(data.tools || '[]') : [];
                this.lastSyncTime = new Date().toISOString();

                // Notify listeners of data change
                if (this.onDataChange) {
                    this.onDataChange(this.cache);
                }
            });

            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;

        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.initialized = false;
            return false;
        }
    },

    /**
     * Get all tools from Firebase
     */
    async getAll() {
        if (!this.isEnabled()) {
            return [];
        }

        if (!this.initialized) {
            await this.initialize();
        }

        // Return from cache if available
        if (this.cache !== null) {
            return this.cache;
        }

        try {
            const snapshot = await this.dataRef.once('value');
            const data = snapshot.val();
            this.cache = data ? JSON.parse(data.tools || '[]') : [];
            return this.cache;
        } catch (error) {
            console.error('Firebase getAll failed:', error);
            // Fallback to localStorage
            const localData = localStorage.getItem('ai-tools-data');
            return localData ? JSON.parse(localData) : [];
        }
    },

    /**
     * Save tools to Firebase
     */
    async save(tools) {
        if (!this.isEnabled()) {
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Update cache
            this.cache = tools;

            // Save to Firebase
            await this.dataRef.set({
                tools: JSON.stringify(tools),
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            });

            // Also save to localStorage as backup
            localStorage.setItem('ai-tools-data', JSON.stringify(tools));

            return true;
        } catch (error) {
            console.error('Firebase save failed:', error);
            // Fallback to localStorage
            localStorage.setItem('ai-tools-data', JSON.stringify(tools));
            return false;
        }
    },

    /**
     * Import data from localStorage to Firebase
     */
    async importFromLocalStorage() {
        const localData = localStorage.getItem('ai-tools-data');
        if (localData) {
            const tools = JSON.parse(localData);
            await this.save(tools);
            console.log('Imported', tools.length, 'tools from localStorage to Firebase');
            return tools.length;
        }
        return 0;
    },

    /**
     * Clear all data (use with caution!)
     */
    async clear() {
        if (!this.isEnabled()) {
            return false;
        }

        try {
            await this.dataRef.remove();
            this.cache = [];
            localStorage.removeItem('ai-tools-data');
            return true;
        } catch (error) {
            console.error('Firebase clear failed:', error);
            return false;
        }
    },

    /**
     * Get connection status
     */
    async getStatus() {
        if (!this.isEnabled()) {
            return { connected: false, backend: 'localStorage' };
        }

        if (!this.initialized) {
            await this.initialize();
        }

        return {
            connected: this.initialized,
            backend: 'Firebase Realtime Database',
            lastSync: this.lastSyncTime,
            cacheSize: this.cache ? this.cache.length : 0
        };
    },

    /**
     * Callback for data changes
     */
    onDataChange: null
};

// Auto-initialize when script loads
if (window.FirebaseStorage.isEnabled()) {
    window.FirebaseStorage.initialize().then(() => {
        console.log('Firebase auto-initialized');
    }).catch(error => {
        console.error('Firebase auto-init failed:', error);
    });
}
