import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle, MessageSquare, ArrowUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../utils/api';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user?.token) return;
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, user?.token]);

  // Real-time notification handling
  useSocket({
    onNewNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play subtle sound if browser allowed
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.volume = 0.2;
        audio.play().catch(() => {}); // Ignore autoplay blocks
      } catch (e) {}
    }
  }, user?._id || user?.id);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'upvote': return <ArrowUp className="w-4 h-4 text-orange-500" />;
      case 'status_update': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'verification': return <ShieldCheck className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-[var(--color-surface-container)] hover:scale-105 active:scale-95 transition-all duration-300 relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--color-on-surface)]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-error)] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[var(--color-surface-container-lowest)]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] rounded-[var(--radius-xl)] bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-soft-4)] backdrop-blur-xl z-[60] overflow-hidden flex flex-col origin-top-right"
          >
            <div className="p-4 border-b border-[var(--color-outline-variant)]/10 flex items-center justify-between bg-[var(--color-surface-container-low)]/50">
              <h3 className="font-bold text-[var(--color-on-surface)]">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-10" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-outline-variant)]/5">
                  {notifications.map((notification) => (
                    <div 
                      key={notification._id}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                      className={`p-4 flex gap-3 transition-colors cursor-pointer hover:bg-[var(--color-surface-container-low)] ${!notification.isRead ? 'bg-[var(--color-primary)]/5' : ''}`}
                    >
                      <div className="shrink-0 mt-1">
                        <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-[var(--color-primary-container)]/30' : 'bg-[var(--color-surface-container-high)]'}`}>
                          {getIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-on-surface)] leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1 font-medium">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="shrink-0 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 text-center border-t border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)]/30">
              <button className="text-xs font-semibold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
