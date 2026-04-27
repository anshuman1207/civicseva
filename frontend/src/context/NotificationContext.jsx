import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = (msg) => addNotification(msg, 'success');
  const error = (msg) => addNotification(msg, 'error');
  const info = (msg) => addNotification(msg, 'info');
  const warning = (msg) => addNotification(msg, 'warning');

  return (
    <NotificationContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`p-4 rounded-lg shadow-lg flex items-start gap-3 border ${
                n.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                'bg-blue-500/10 border-blue-500/20 text-blue-500'
              } backdrop-blur-md`}
            >
              <div className="mt-0.5">
                {n.type === 'success' && <CheckCircle size={18} />}
                {n.type === 'error' && <AlertCircle size={18} />}
                {n.type === 'warning' && <AlertTriangle size={18} />}
                {n.type === 'info' && <Info size={18} />}
              </div>
              <div className="flex-1 text-sm font-medium">{n.message}</div>
              <button
                onClick={() => removeNotification(n.id)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
