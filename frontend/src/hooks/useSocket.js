import { useEffect, useRef, useState } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export const useSocket = (eventHandlers = {}) => {
  const socket = useSocketContext();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(socket?.connected || false);
  
  const handlersRef = useRef(eventHandlers);

  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const wrappedHandlers = {};
    
    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      wrappedHandlers[event] = (data) => {
        handler(data);
      };
      socket.on(event, wrappedHandlers[event]);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      Object.entries(wrappedHandlers).forEach(([event, _handler]) => {
        socket.off(event, wrappedHandlers[event]);
      });
    };
  }, [socket]);

  return { isConnected, socket };
};
