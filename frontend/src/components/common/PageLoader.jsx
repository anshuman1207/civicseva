import { motion } from 'framer-motion';

const PageLoader = () => {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-16 h-16 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full"
        />
        {/* Inner Pulse */}
        <motion.div 
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-8 h-8 bg-[var(--color-primary)]/40 rounded-full blur-md"
        />
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-bold text-[var(--color-on-surface)] tracking-tight">Initializing Interface</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 animate-pulse">
          Loading optimized assets...
        </p>
      </div>

      {/* Decorative Dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
            className="w-1.5 h-1.5 bg-[var(--color-primary)]/60 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

export default PageLoader;
