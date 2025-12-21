
'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { logger } from '@/lib/logger';

/**
 * Custom hook to get a document from Firestore in real-time.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @returns The document data, loading state, and error state.
 */
export function useDoc<T = DocumentData>(collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { firestore } = initializeFirebase();

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      setData(null);
      return;
    }

    const docRef = doc(firestore, collectionName, docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (err) => {
      logger.error(err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId, firestore]);

  return { data, loading, error };
}
