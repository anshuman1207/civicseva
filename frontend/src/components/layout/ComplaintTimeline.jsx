import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, AlertCircle, Info, Star, ChevronRight } from 'lucide-react';

const STATUS_ICONS = {
  'Pending': <Clock className="w-4 h-4" />,
  'In Progress': <AlertCircle className="w-4 h-4" />,
  'Resolved': <CheckCircle2 className="w-4 h-4" />,
  'Milestone': <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
  'Default': <Info className="w-4 h-4" />
};

const STATUS_COLORS = {
  'Pending': 'border-red-200 bg-red-50 text-red-700',
  'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
  'Resolved': 'border-green-200 bg-green-50 text-green-700',
  'Milestone': 'border-amber-300 bg-amber-50 text-amber-800'
};

const ComplaintTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-secondary)]">
        <Clock className="w-12 h-12 opacity-20 mb-2" />
        <p className="text-sm">No activity history available yet.</p>
      </div>
    );
  }

  // Sort timeline by timestamp (descending - newest first)
  const sortedTimeline = [...timeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-surface-container-high)]">
      {sortedTimeline.map((item, index) => {
        const isMilestone = item.isMilestone;
        const icon = isMilestone ? STATUS_ICONS['Milestone'] : (STATUS_ICONS[item.status] || STATUS_ICONS['Default']);
        const colors = isMilestone ? STATUS_COLORS['Milestone'] : (STATUS_COLORS[item.status] || 'border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text-primary)]');
        
        return (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4 relative"
          >
            {/* Icon Node */}
            <div className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-sm ${colors}`}>
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors}`}>
                  {item.status}
                </span>
                <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="bg-[var(--color-surface-container-low)] rounded-xl p-3 border border-[var(--color-surface-container-high)]">
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                  {item.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] font-medium">
                  <span className="bg-[var(--color-surface-container-highest)] px-2 py-0.5 rounded italic">
                    By: {item.actor || 'System'}
                  </span>
                  {isMilestone && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      Community Milestone
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ComplaintTimeline;
