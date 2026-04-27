import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_URL } from '../config/constants';

const ConnectivityContext = createContext({
  isOnline: navigator.onLine,
  isServerUp: true,
});

export const ConnectivityProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerUp, setIsServerUp] = useState(true);

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) {
      setIsServerUp(false);
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Ping the new health endpoint
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET', // Changed to GET as we added a JSON response
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      setIsServerUp(response.ok);
    } catch (error) {
      setIsServerUp(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkServer();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsServerUp(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkServer();

    // Periodic check every 30 seconds if offline or server down
    const interval = setInterval(() => {
      if (!isOnline || !isServerUp) {
        checkServer();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, isServerUp, checkServer]);

  return (
    <ConnectivityContext.Provider value={{ isOnline, isServerUp, refreshServerStatus: checkServer }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => useContext(ConnectivityContext);
