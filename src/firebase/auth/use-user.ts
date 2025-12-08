
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

/**
 * Custom hook to get the current authenticated user.
 * @returns The current Firebase user object, or null if not authenticated, or undefined if loading.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>();
  const { auth } = initializeFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  return user;
}
