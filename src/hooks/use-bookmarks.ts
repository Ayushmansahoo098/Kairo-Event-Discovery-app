'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { logInteractionEvent } from '@/lib/analytics';

const STORAGE_KEY = 'kairo-bookmarks';

function readBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const { user } = useAuthContext();
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Synchronize state from LocalStorage (Guest) or Firestore (Authenticated)
  useEffect(() => {
    if (!user) {
      // Guest mode fallback - use requestAnimationFrame to avoid synchronous cascading renders
      const handle = requestAnimationFrame(() => {
        setBookmarks(readBookmarks());
      });
      return () => cancelAnimationFrame(handle);
    }

    // Authenticated mode: Sync from Firestore subcollection in real time
    const bookmarksColRef = collection(db, 'users', user.id, 'bookmarks');

    const unsubscribe = onSnapshot(
      bookmarksColRef,
      (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.id);
        setBookmarks(ids);
      },
      (error) => {
        console.error('Error listening to Firestore bookmarks snapshot:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleBookmark = useCallback(
    async (id: string) => {
      if (!user) {
        // Guest mode update
        const current = readBookmarks();
        const next = current.includes(id)
          ? current.filter((b) => b !== id)
          : [...current, id];
        setBookmarks(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

        if (!current.includes(id)) {
          logInteractionEvent({
            userId: "anonymous",
            eventId: id,
            action: "save",
          });
        }
        return;
      }

      // Authenticated mode update
      try {
        const bookmarkDocRef = doc(db, 'users', user.id, 'bookmarks', id);
        if (bookmarks.includes(id)) {
          await deleteDoc(bookmarkDocRef);
        } else {
          await setDoc(bookmarkDocRef, {
            savedAt: serverTimestamp(),
          });
          logInteractionEvent({
            userId: user.id,
            eventId: id,
            action: "save",
          });
        }
      } catch (error) {
        console.error('Failed to toggle Firestore bookmark:', error);
      }
    },
    [user, bookmarks]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  const clearBookmarks = useCallback(async () => {
    if (!user) {
      // Guest mode clear
      setBookmarks([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return;
    }

    // Authenticated mode clear
    try {
      const bookmarksColRef = collection(db, 'users', user.id, 'bookmarks');
      const snapshot = await getDocs(bookmarksColRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to clear Firestore bookmarks:', error);
    }
  }, [user]);

  return { bookmarks, toggleBookmark, isBookmarked, clearBookmarks } as const;
}
