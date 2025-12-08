
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '.';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

/**
 * Provider component that initializes Firebase and makes the instances available to the rest of the app.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const firebaseServices = initializeFirebase();
  return (
    <FirebaseContext.Provider value={firebaseServices}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Hook to access the Firebase instances.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

/**
 * Hook to access the Firebase App instance.
 */
export const useFirebaseApp = (): FirebaseApp => {
    const { app } = useFirebase();
    if (!app) {
        throw new Error("Firebase app is not initialized yet.");
    }
    return app;
}

/**
 * Hook to access the Firebase Auth instance.
 */
export const useAuth = (): Auth => {
    const { auth } = useFirebase();
    if (!auth) {
        throw new Error("Firebase Auth is not initialized yet.");
    }
    return auth;
}

/**
 * Hook to access the Firestore instance.
 */
export const useFirestore = (): Firestore => {
    const { firestore } = useFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized yet.");
    }
    return firestore;
}
