/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, X, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useComplaintQueue } from '../../hooks/useComplaintQueue';

const ConnectivityBanner = () => {
  const { isOnline, isServerUp, refreshServerStatus } = useConnectivity();
  const { queueLength, syncing, syncProgress, syncQueue } = useComplaintQueue();

  // Banner state machine: 'hidden' | 'offline' | 'syncing' | 'sync-done' | 'back-online' | 'server-down'
  const [bannerState, setBannerState] = useState('hidden');
  const [syncResult, setSyncResult] = useState(null);
  const wasOfflineRef = useRef(false);
  const wasServerDownRef = useRef(false);
  const hideTimerRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback((ms = 4000) => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setBannerState('hidden');
      setSyncResult(null);
    }, ms);
  }, [clearHideTimer]);

  // React to connectivity and server health changes
  useEffect(() => {
    if (!isOnline) {
      clearHideTimer();
      wasOfflineRef.current = true;
      setBannerState('offline');
    } else if (!isServerUp) {
      clearHideTimer();
      wasServerDownRef.current = true;
      setBannerState('server-down');
    } else {
      // We are online and server is up
      if (wasOfflineRef.current || wasServerDownRef.current) {
        const wasDisconnected = wasOfflineRef.current || wasServerDownRef.current;
        wasOfflineRef.current = false;
        wasServerDownRef.current = false;

        if (queueLength > 0) {
          setBannerState('syncing');
          syncQueue().then((result) => {
            setSyncResult(result);
            setBannerState('sync-done');
            scheduleHide(4000);
          });
        } else {
          setBannerState('back-online');
          scheduleHide(3000);
        }
      }
    }
  }, [isOnline, isServerUp, queueLength, syncQueue, scheduleHide, clearHideTimer]);

  // Track syncing state from hook
  useEffect(() => {
    if (syncing) {
      setBannerState('syncing');
    }
  }, [syncing]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  const isVisible = bannerState !== 'hidden';

  const getBannerConfig = () => {
    switch (bannerState) {
      case 'offline':
        return {
          bg: 'bg-amber-500/90 border-amber-400/40',
          icon: <WifiOff size={20} className="animate-pulse" />,
          title: 'Working Offline',
          subtitle: queueLength > 0
            ? `${queueLength} report${queueLength > 1 ? 's' : ''} queued for upload.`
            : 'Your reports will be saved and sent when connected.',
          dismissible: true,
        };
      case 'server-down':
        return {
          bg: 'bg-rose-600/90 border-rose-500/40',
          icon: <AlertCircle size={20} className="animate-pulse" />,
          title: 'Server Unreachable',
          subtitle: 'Our backend is temporarily unavailable. Retrying connection...',
          dismissible: true,
          action: (
            <button 
              onClick={() => refreshServerStatus()}
              className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-medium transition-colors"
            >
              Retry Now
            </button>
          )
        };
      case 'syncing':
        return {
          bg: 'bg-[var(--color-primary)]/90 border-[var(--color-primary-container)]/40',
          icon: <CloudUpload size={20} className="animate-bounce" />,
          title: 'Syncing Reports…',
          subtitle: `Uploading ${syncProgress.synced} of ${syncProgress.total}`,
          dismissible: false,
        };
      case 'sync-done':
        if (syncResult?.failed > 0) {
          return {
            bg: 'bg-amber-600/90 border-amber-500/40',
            icon: <AlertCircle size={20} />,
            title: 'Sync Partially Complete',
            subtitle: `${syncResult.synced} uploaded, ${syncResult.failed} will retry later.`,
            dismissible: true,
          };
        }
        return {
          bg: 'bg-green-600/90 border-green-500/40',
          icon: <CheckCircle size={20} />,
          title: 'All Reports Synced',
          subtitle: `${syncResult?.synced || 0} report${(syncResult?.synced || 0) > 1 ? 's' : ''} uploaded successfully.`,
          dismissible: true,
        };
      case 'back-online':
        return {
          bg: 'bg-green-600/90 border-green-500/40',
          icon: <Wifi size={20} />,
          title: 'Connected',
          subtitle: 'Server and internet connection restored.',
          dismissible: false,
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();

  return (
    <AnimatePresence>
      {isVisible && config && (
        <motion.div
          initial={{ y: -100, opacity: 0, x: '-50%' }}
          animate={{ y: 16, opacity: 1, x: '-50%' }}
          exit={{ y: -100, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-[var(--shadow-soft-3)] backdrop-blur-xl border text-white ${config.bg}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shrink-0">
                {config.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[15px] tracking-tight leading-tight">
                  {config.title}
                </p>
                <p className="text-xs opacity-90 mt-0.5 truncate">
                  {config.subtitle}
                </p>
                {config.action}
                {/* Sync progress bar */}
                {bannerState === 'syncing' && syncProgress.total > 0 && (
                  <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white/80 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
                      transition={{ ease: 'easeOut', duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            </div>
            {config.dismissible && (
              <button
                onClick={() => {
                  clearHideTimer();
                  setBannerState('hidden');
                  setSyncResult(null);
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0 ml-2"
                aria-label="Dismiss notice"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectivityBanner;
