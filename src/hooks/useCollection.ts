import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gelpiyobeat_collection_v2'; // New key for tracking counts
const OLD_STORAGE_KEY = 'gelpiyobeat_collection';

export function useCollection() {
  const [collection, setCollection] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    // 1. Try reading the new structure with counts
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse collection data', e);
      }
    }

    // 2. Try migrating from old simple string array structure
    const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldSaved) {
      try {
        const oldIds: string[] = JSON.parse(oldSaved);
        const next: { [id: string]: number } = {};
        oldIds.forEach(id => {
          next[id] = 1;
        });
        setCollection(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to migrate old collection data', e);
      }
    }
  }, []);

  const unlockCharacter = (id: string) => {
    setCollection((prev) => {
      const next = { ...prev };
      next[id] = (next[id] || 0) + 1; // Increment get count!
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const hasCharacter = (id: string) => (collection[id] || 0) > 0;
  const getGetCount = (id: string) => collection[id] || 0;

  return { 
    unlockedIds: Object.keys(collection), 
    collection, 
    unlockCharacter, 
    hasCharacter, 
    getGetCount 
  };
}
