import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, CloudUpload, RefreshCw } from 'lucide-react';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useComplaintQueue } from '../../hooks/useComplaintQueue';

/**
 * Compact offline queue status widget for the Sidebar.
 * Shows pending queue count, syncing state, and a manual retry button.
 */
export default function OfflineQueueWidget() {
  const { isOnline } = useConnectivity();
  const { queueLength, syncing, syncProgress, syncQueue } = useComplaintQueue();

  // Don't render if online and queue is empty
  if (isOnline && queueLength === 0 && !syncing) return null;

  const handleRetry = () => {
    if (isOnline && queueLength > 0 && !syncing) {
      syncQueue();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="mb-3"
      >
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border transition-colors
          ${!isOnline
            ? 'bg-amber-50 border-amber-200/60'
            : syncing
              ? 'bg-blue-50 border-blue-200/60'
              : 'bg-[var(--color-surface-container-low)] border-[var(--color-outline-variant)]/30'
          }
        `}>
          {/* Icon */}
          <div className={`
            p-2 rounded-[var(--radius-md)] shrink-0
            ${!isOnline
              ? 'bg-amber-100 text-amber-600'
              : syncing
                ? 'bg-blue-100 text-blue-600'
                : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
            }
          `}>
            {syncing ? (
              <CloudUpload size={18} className="animate-bounce" />
            ) : !isOnline ? (
              <CloudOff size={18} />
            ) : (
              <CloudOff size={18} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-on-surface)] leading-tight">
              {syncing
                ? `Syncing ${syncProgress.synced}/${syncProgress.total}`
                : `${queueLength} pending`
              }
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 truncate">
              {syncing
                ? 'Uploading queued reports…'
                : !isOnline
                  ? 'Will sync when online'
                  : 'Tap retry to upload now'
              }
            </p>

            {/* Mini progress bar during sync */}
            {syncing && syncProgress.total > 0 && (
              <div className="mt-1.5 h-1 bg-blue-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
            )}
          </div>

          {/* Retry button — only when online, has items, and not syncing */}
          {isOnline && queueLength > 0 && !syncing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRetry}
              className="p-2 rounded-full bg-[var(--color-primary)] text-white hover:brightness-110 transition-all shrink-0"
              aria-label="Retry uploading queued reports"
              title="Retry sync"
            >
              <RefreshCw size={14} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
