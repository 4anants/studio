
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, type Query, type DocumentData } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { logger } from '@/lib/logger';

/**
 * Custom hook to get a collection from Firestore in real-time.
 * @param collectionName The name of the collection.
 * @param queryConstraints Optional query constraints.
 * @returns The collection data, loading state, and error state.
 */
export function useCollection<T = DocumentData>(
  collectionName: string,
  ...queryConstraints: any[]
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { firestore } = initializeFirebase();

  useEffect(() => {
    try {
      const collectionRef = collection(firestore, collectionName);
      const q: Query = query(collectionRef, ...queryConstraints.filter(Boolean));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        setData(documents);
        setLoading(false);
      }, (err) => {
        logger.error(err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      logger.error(err);
      setError(err);
      setLoading(false);
      return () => {};
    }
  }, [collectionName, firestore, ...queryConstraints]);

  return { data, loading, error };
}
