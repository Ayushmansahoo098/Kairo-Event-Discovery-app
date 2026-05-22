'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(readBookmarks());
  }, []);

  const persist = useCallback((next: string[]) => {
    setBookmarks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleBookmark = useCallback(
    (id: string) => {
      const current = readBookmarks();
      const next = current.includes(id)
        ? current.filter((b) => b !== id)
        : [...current, id];
      persist(next);
    },
    [persist]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  const clearBookmarks = useCallback(() => {
    persist([]);
  }, [persist]);

  return { bookmarks, toggleBookmark, isBookmarked, clearBookmarks } as const;
}
