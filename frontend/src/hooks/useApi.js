import { useState, useCallback, useRef } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useConnectivity } from '../context/ConnectivityContext';

const globalToastThrottle = { lastNetworkErrorTime: 0 };

/**
 * Custom hook for handling API calls with loading, error, and toast integration.
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { refreshServerStatus, isServerUp, isOnline } = useConnectivity();
  
  // Use refs to keep execute stable and avoid infinite loops when connectivity state changes
  const connectivityRef = useRef({ isServerUp, isOnline });
  connectivityRef.current = { isServerUp, isOnline };

  const execute = useCallback(async (apiMethodOrTask, url, ...args) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      
      // Support for execute(() => task())
      if (typeof apiMethodOrTask === 'function') {
        result = await apiMethodOrTask();
      } else {
        // Support for execute('get', '/url', args)
        const method = api[apiMethodOrTask];
        if (!method) throw new Error(`API method ${apiMethodOrTask} not found`);
        result = await method(url, ...args);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || '';
      const isNetworkError = 
        errorMsg.includes('failed to fetch') || 
        errorMsg.includes('networkerror') ||
        errorMsg.includes('unable to connect') ||
        err.name === 'TypeError' ||
        err.status === 'NETWORK_ERROR' || 
        err.status === 'OFFLINE' ||
        err.status === 408;

      let message = err.message || 'An unexpected error occurred';

      if (isNetworkError) {
        // Trigger a background health check to update the global UI banner
        refreshServerStatus();
        message = 'Unable to connect to the server. Please check your internet or try again later.';
      } else if (err.status >= 500) {
        message = 'The server is currently experiencing issues. Please try again in a few moments.';
      } else if (err.status === 413) {
        message = 'The file you are trying to upload is too large. Please select a smaller file.';
      }

      setError(message);
      
      // Determine if we should show a toast
      const shouldShowToast = () => {
        // Auth 401s are usually handled globally by redirecting to login.
        // However, on the login page itself, a 401 means "invalid credentials"
        // and should be shown to the user.
        if (err.status === 401) {
          const isAuthEndpoint = err.endpoint?.includes('/auth/login') || err.endpoint?.includes('/auth/register');
          return isAuthEndpoint; 
        }
        
        if (isNetworkError) {
          const { isServerUp: currentIsServerUp, isOnline: currentIsOnline } = connectivityRef.current;
          
          // If server is known to be down OR offline, the ConnectivityBanner handles it
          if (!currentIsServerUp || !currentIsOnline) return false;
          
          // Anti-spam: don't show network toast more than once every 10 seconds globally
          const now = Date.now();
          if (now - globalToastThrottle.lastNetworkErrorTime < 10000) {
            return false;
          }
          globalToastThrottle.lastNetworkErrorTime = now;
          return true;
        }
        return true;
      };

      if (shouldShowToast()) {
        showToast(message, 'error');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshServerStatus]);

  return {
    loading,
    apiLoading: loading,
    error,
    execute,
    // Shorthands
    get: useCallback((url, options) => execute('get', url, options), [execute]),
    post: useCallback((url, body, options) => execute('post', url, body, options), [execute]),
    patch: useCallback((url, body, options) => execute('patch', url, body, options), [execute]),
    put: useCallback((url, body, options) => execute('put', url, body, options), [execute]),
    del: useCallback((url, options) => execute('delete', url, options), [execute]),
    upload: useCallback((url, formData, options) => execute('upload', url, formData, options), [execute]),
  };
};
