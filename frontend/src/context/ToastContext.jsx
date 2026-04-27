import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // I should check if uuid is available, otherwise use a simple counter

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    // Deduplicate: Don't show the same message if it's already active
    setToasts((prev) => {
      if (prev.some(t => t.message === message)) return prev;
      
      const id = uuidv4();
      const newToasts = [...prev, { id, message, type }];
      
      setTimeout(() => {
        setToasts((curr) => curr.filter((toast) => toast.id !== id));
      }, duration);
      
      return newToasts;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
