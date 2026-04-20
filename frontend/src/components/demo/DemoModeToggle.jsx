import { memo } from 'react';
import { motion } from 'framer-motion';
import { Presentation, Play, Square, Eye } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

/**
 * A toggle button that starts/stops demo presentation mode.
 * Designed to sit in the Sidebar or Settings page.
 */
function DemoModeToggle({ variant = 'sidebar' }) {
  const { isDemoMode, isPresentationMode, toggleDemoMode, togglePresentationMode } = useDemo();

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDemoMode}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          isDemoMode
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
            : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
        }`}
      >
        {isDemoMode ? <Square className="w-3.5 h-3.5" /> : <Presentation className="w-3.5 h-3.5" />}
        {isDemoMode ? 'Exit Demo' : 'Demo Mode'}
      </motion.button>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleDemoMode}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-[var(--radius-lg)] font-medium transition-all ${
          isDemoMode
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200/50'
            : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200/50 hover:border-purple-300'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isDemoMode ? 'bg-white/20' : 'bg-purple-100'
        }`}>
          {isDemoMode ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold">{isDemoMode ? 'Exit Demo Mode' : 'Start Demo Mode'}</p>
          <p className={`text-[10px] ${isDemoMode ? 'text-white/70' : 'text-purple-500'}`}>
            {isDemoMode ? 'Presentation active' : 'Guided walkthrough'}
          </p>
        </div>
        {isDemoMode && (
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {isDemoMode && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={togglePresentationMode}
          className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-lg)] text-xs font-semibold transition-all ${
            isPresentationMode
              ? 'bg-indigo-500 text-white'
              : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {isPresentationMode ? 'Clean Mode ON' : 'Enable Clean Mode'}
        </motion.button>
      )}
    </div>
  );
}

export default memo(DemoModeToggle);
