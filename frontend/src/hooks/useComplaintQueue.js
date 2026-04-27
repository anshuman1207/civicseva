import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const DB_NAME = 'CivicSevaOfflineDB';
const STORE_NAME = 'complaintsQueue';
const DB_VERSION = 1;
// API URL is managed via the centralized `api` utility (config/constants.js)

export const useComplaintQueue = () => {
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });
  const syncLockRef = useRef(false);

  // Initialize IndexedDB
  const getDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  };

  const updateQueueLength = useCallback(async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        setQueueLength(countRequest.result);
      };
    } catch (error) {
      console.error('Failed to get offline queue length:', error);
    }
  }, []);

  const saveToQueue = useCallback(async (reportData) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        ...reportData,
        timestamp: Date.now()
      };

      store.add(entry);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          updateQueueLength();
          resolve(true);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save to offline queue:', error);
      throw error;
    }
  }, [updateQueueLength]);

  const getQueue = useCallback(async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to retrieve offline queue:', error);
      return [];
    }
  }, []);

  const removeFromQueue = useCallback(async (id) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          updateQueueLength();
          resolve(true);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
      throw error;
    }
  }, [updateQueueLength]);

  /**
   * Syncs all queued complaints to the server.
   * Returns { synced: number, failed: number } summary.
   */
  const syncQueue = useCallback(async () => {
    // Prevent concurrent sync runs
    if (syncLockRef.current) return { synced: 0, failed: 0 };
    
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    syncLockRef.current = true;
    setSyncing(true);
    setSyncProgress({ synced: 0, total: queue.length });

    let syncedCount = 0;
    let failedCount = 0;

    for (const report of queue) {
      try {
        const formData = new FormData();

        // Separate out internal fields from report payload
        const { id, timestamp, photo, ...fields } = report;
        void timestamp; // intentionally discarded from queue metadata

        Object.entries(fields).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });

        // Attach photo if it was stored as a File/Blob
        if (photo && photo instanceof Blob) {
          formData.append('photo', photo, photo.name || 'offline_photo.jpg');
        }

        await api.upload('/complaints', formData);

        // Successfully synced — remove from IndexedDB
        await removeFromQueue(id);
        syncedCount++;
        setSyncProgress({ synced: syncedCount, total: queue.length });

      } catch (error) {
        console.error(`Failed to sync report ${report.id}:`, error);
        failedCount++;
        // Item stays in IndexedDB for the next sync attempt
      }
    }

    setSyncing(false);
    syncLockRef.current = false;

    return { synced: syncedCount, failed: failedCount };
  }, [getQueue, removeFromQueue]);

  // Initial count load
  useEffect(() => {
    updateQueueLength();
  }, [updateQueueLength]);

  return {
    queueLength,
    syncing,
    syncProgress,
    saveToQueue,
    getQueue,
    removeFromQueue,
    syncQueue
  };
};
