import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, X, Monitor,
  ChevronUp, ChevronDown, Presentation, Maximize2,
  Minimize2, Eye, EyeOff
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

// ─── Step Progress Dot ─────────────────────────────
function StepDot({ index, isActive, isPast, onClick, label }) {
  return (
    <button
      onClick={() => onClick(index)}
      className="group relative flex flex-col items-center gap-1"
      title={label}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.3 : 1,
          backgroundColor: isActive
            ? 'var(--color-primary)'
            : isPast
              ? 'var(--color-primary-container)'
              : 'var(--color-surface-container-high)',
        }}
        className="w-2.5 h-2.5 rounded-full transition-colors cursor-pointer"
      />
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-7 whitespace-nowrap text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20"
        >
          {label}
        </motion.div>
      )}
    </button>
  );
}

// ─── Main Presentation Controller ──────────────────
function PresentationController() {
  const {
    isDemoMode,
    isPresentationMode,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    isAutoPlaying,
    showOverlay,
    steps,
    toggleDemoMode,
    togglePresentationMode,
    nextStep,
    prevStep,
    goToStep,
    setIsAutoPlaying,
    setShowOverlay,
  } = useDemo();

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isDemoMode) return null;

  return (
    <>
      {/* ─── Full-Screen Step Overlay ──────────────── */}
      <AnimatePresence>
        {showOverlay && currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setShowOverlay(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            
            {/* Content */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 max-w-lg mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Step Number Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-bold uppercase tracking-widest rounded-full border border-white/10 mb-6"
              >
                <Monitor className="w-3.5 h-3.5" />
                Step {currentStepIndex + 1} of {totalSteps}
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3"
              >
                {currentStep.title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-blue-300 font-semibold mb-4"
              >
                {currentStep.subtitle}
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-white/60 leading-relaxed max-w-md mx-auto mb-8"
              >
                {currentStep.description}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-4"
              >
                <button
                  onClick={() => setShowOverlay(false)}
                  className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                >
                  View Live Demo →
                </button>
                <button
                  onClick={() => {
                    setShowOverlay(false);
                    setIsAutoPlaying(true);
                  }}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Auto-Play
                  </span>
                </button>
              </motion.div>

              {/* Keyboard Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-[10px] text-white/30 mt-6 uppercase tracking-widest"
              >
                Press Space or → to continue • ESC to exit
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Bottom Controller Bar ──────── */}
      <AnimatePresence>
        {!showOverlay && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-2xl"
          >
            <div className="bg-[var(--color-surface-container-lowest)]/95 backdrop-blur-xl border border-[var(--color-outline-variant)]/30 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-[var(--color-surface-container-high)]">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Collapsed View */}
              {isCollapsed ? (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Presentation className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">
                      {currentStep?.title}
                    </span>
                    <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                      {currentStepIndex + 1}/{totalSteps}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={prevStep} className="p-1.5 hover:bg-[var(--color-surface-container)] rounded-lg transition-colors">
                      <SkipBack className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />
                    </button>
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="p-1.5 hover:bg-[var(--color-surface-container)] rounded-lg transition-colors"
                    >
                      {isAutoPlaying ? <Pause className="w-3.5 h-3.5 text-[var(--color-primary)]" /> : <Play className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />}
                    </button>
                    <button onClick={nextStep} className="p-1.5 hover:bg-[var(--color-surface-container)] rounded-lg transition-colors">
                      <SkipForward className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />
                    </button>
                    <button onClick={() => setIsCollapsed(false)} className="p-1.5 hover:bg-[var(--color-surface-container)] rounded-lg transition-colors ml-1">
                      <ChevronUp className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Expanded View */
                <div className="p-4 space-y-3">
                  {/* Top Row: Info + Controls */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Presentation className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                        <h3 className="text-sm font-bold text-[var(--color-on-surface)] truncate">{currentStep?.title}</h3>
                        {isAutoPlaying && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Auto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-2 leading-relaxed">
                        {currentStep?.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={togglePresentationMode}
                        className="p-2 hover:bg-[var(--color-surface-container)] rounded-xl transition-colors"
                        title={isPresentationMode ? 'Exit Clean Mode' : 'Clean Mode'}
                      >
                        {isPresentationMode ? <EyeOff className="w-4 h-4 text-[var(--color-primary)]" /> : <Eye className="w-4 h-4 text-[var(--color-on-surface-variant)]" />}
                      </button>
                      <button
                        onClick={() => setShowOverlay(true)}
                        className="p-2 hover:bg-[var(--color-surface-container)] rounded-xl transition-colors"
                        title="Show Slide"
                      >
                        <Maximize2 className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                      </button>
                      <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-2 hover:bg-[var(--color-surface-container)] rounded-xl transition-colors"
                        title="Minimize"
                      >
                        <ChevronDown className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                      </button>
                      <button
                        onClick={toggleDemoMode}
                        className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                        title="Exit Demo"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Step Navigation Dots */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    {steps.map((step, i) => (
                      <StepDot
                        key={step.id}
                        index={i}
                        isActive={i === currentStepIndex}
                        isPast={i < currentStepIndex}
                        onClick={goToStep}
                        label={step.title}
                      />
                    ))}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={prevStep}
                      disabled={currentStepIndex === 0}
                      className="p-2.5 rounded-xl hover:bg-[var(--color-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <SkipBack className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                    </button>

                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <button
                      onClick={nextStep}
                      className="p-2.5 rounded-xl hover:bg-[var(--color-surface-container)] transition-all"
                    >
                      <SkipForward className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(PresentationController);
