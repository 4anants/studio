
/**
 * @fileoverview This file initializes Firebase services and exports related hooks and utilities.
 *
 * It provides a centralized way to initialize Firebase, connecting to emulators for local
 * development and to production services otherwise. It exports the initialized app, auth,
 * and firestore instances, along with custom hooks for accessing them within React components.
 * This setup ensures a consistent and efficient way to interact with Firebase throughout
 * the application.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Export hooks and providers from their respective files
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './provider';
export * from './client-provider';


let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Returns the initialized Firebase services.
 * This function provides a singleton pattern for Firebase services, ensuring that
 * connections (including emulator connections) are established only once.
 *
 * @returns An object containing the initialized Firebase app, auth, and firestore instances.
 */
export function initializeFirebase() {
    if (typeof window === 'undefined') {
        // On the server, return null or mock instances if needed
        return { app: null, auth: null, firestore: null };
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        firestore = getFirestore(app);

        // In a development environment, connect to the local emulators
        if (process.env.NODE_ENV === 'development') {
            console.log('Connecting to Firebase Emulators');
            // Check if emulators are already connected to prevent errors on hot reloads
            // @ts-ignore - _emulatorConfig is not in the type definition but it is there
            if (!auth.emulatorConfig) {
                connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            }
            // @ts-ignore
            if (!firestore._settings.host) {
                connectFirestoreEmulator(firestore, 'localhost', 8080);
            }
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        firestore = getFirestore(app);
    }
  
    return { app, auth, firestore };
}
