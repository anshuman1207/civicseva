import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

// Singleton socket instance so multiple hooks share one connection
let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      autoConnect: true,
    });
  }
  return socketInstance;
}

/**
 * useSocket — subscribe to real-time server events.
 *
 * @param {Object} handlers — { onNewComplaint, onUpvoteUpdate, onStatusUpdate, onNewComment, onDeleteComment, onFollowUpdate, onVerifyUpdate, onNewActivity, onNewNotification }
 * @param {String} userId — optional user ID to join a private room
 */
export const useSocket = (handlers = {}, userId = null) => {
  const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);
  const handlersRef = useRef(handlers);
  const recentEventsRef = useRef(new Set()); // For deduplication

  // Keep handlers ref fresh without re-running the effect
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const stableHandler = useCallback((event) => (data) => {
    const fn = handlersRef.current[event];
    if (typeof fn === 'function') {
      // Prevent repeated notifications by deduplicating at the hook level
      const sig = `${event}-${JSON.stringify(data)}`;
      if (recentEventsRef.current.has(sig)) return;
      
      recentEventsRef.current.add(sig);
      setTimeout(() => {
        if (recentEventsRef.current) {
          recentEventsRef.current.delete(sig);
        }
      }, 2000);

      fn(data);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      // Stable room subscriptions: re-join room upon connection/reconnection
      if (userId) {
        socket.emit('join', userId);
      }
    };
    
    const onDisconnect = () => setIsConnected(false);
    
    const onConnectError = (err) => {
      console.warn('Socket connect error:', err.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // If already connected when the hook mounts, trigger onConnect manually
    if (socket.connected) {
      onConnect();
    }

    // Event listeners
    const events = [
      'newComplaint', 'upvoteUpdate', 'statusUpdate', 'newComment', 
      'deleteComment', 'followUpdate', 'verifyUpdate', 'newActivity', 
      'newNotification'
    ];

    const eventHandlers = events.map(ev => ({
      name: ev,
      handler: stableHandler(`on${ev.charAt(0).toUpperCase() + ev.slice(1)}`)
    }));

    eventHandlers.forEach(({ name, handler }) => {
      // Duplicate listener prevention (off before on just in case, though useEffect cleanup usually handles it)
      socket.off(name, handler);
      socket.on(name, handler);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      eventHandlers.forEach(({ name, handler }) => {
        socket.off(name, handler);
      });
    };
  }, [stableHandler, userId]);

  return { isConnected, socket: socketInstance };
};
