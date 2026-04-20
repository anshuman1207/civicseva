import { motion } from 'framer-motion';

export const Skeleton = ({ className, variant = 'rect' }) => {
  const baseClasses = "relative overflow-hidden bg-[var(--color-surface-container-high)]";
  const variantClasses = {
    rect: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
        }}
      />
    </div>
  );
};

export const ComplaintCardSkeleton = () => (
  <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm flex gap-5">
    {/* Image Skeleton */}
    <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
    
    <div className="flex-1 space-y-3 py-1">
      {/* Title & Badge */}
      <div className="flex justify-between items-start">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Meta Info */}
      <div className="flex gap-4">
        <Skeleton variant="text" className="h-3 w-24" />
        <Skeleton variant="text" className="h-3 w-32" />
      </div>
      
      {/* Footer / Actions */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <Skeleton variant="rect" className="h-8 w-16 rounded-full" />
          <Skeleton variant="rect" className="h-8 w-16 rounded-full" />
        </div>
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="rect" className="h-10 w-10 rounded-2xl" />
      <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="h-4 w-24" />
      <Skeleton variant="text" className="h-8 w-32" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="text" className="h-4 w-96" />
      </div>
      <Skeleton variant="rect" className="h-10 w-32 rounded-xl" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <ComplaintCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton variant="text" className="h-6 w-48" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    </div>
  </div>
);

export const ChallengeCardSkeleton = () => (
  <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-[var(--radius-2xl)] border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-5/6" />
      </div>
      <Skeleton variant="rect" className="h-6 w-16 rounded-lg ml-4" />
    </div>
    <div className="mt-6">
      <div className="flex justify-between items-end mb-2">
        <Skeleton variant="text" className="h-4 w-12" />
        <Skeleton variant="text" className="h-4 w-8" />
      </div>
      <Skeleton variant="rect" className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="w-full h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide">
    {/* Header Section */}
    <div className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/20 flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <Skeleton variant="circle" className="w-24 h-24 shrink-0" />
      <div className="flex-1 text-center sm:text-left space-y-3 w-full mt-2">
        <Skeleton variant="text" className="h-8 w-48 mx-auto sm:mx-0" />
        <Skeleton variant="text" className="h-4 w-32 mx-auto sm:mx-0" />
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
          <Skeleton variant="rect" className="h-6 w-24 rounded-full" />
          <Skeleton variant="rect" className="h-6 w-32 rounded-full" />
        </div>
      </div>
    </div>

    {/* Level & XP Progress Card */}
    <div className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 w-full">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton variant="rect" className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton variant="text" className="h-3 w-24" />
            <Skeleton variant="text" className="h-8 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-8 w-full md:w-auto">
          <div className="space-y-2 flex-1 items-end flex flex-col">
            <Skeleton variant="text" className="h-3 w-16" />
            <Skeleton variant="text" className="h-8 w-20" />
          </div>
          <div className="space-y-2 flex-1 items-end flex flex-col">
            <Skeleton variant="text" className="h-3 w-16" />
            <Skeleton variant="text" className="h-8 w-24" />
          </div>
        </div>
      </div>
      <Skeleton variant="rect" className="h-1.5 w-full rounded-full mt-12 mb-16" />
      <Skeleton variant="rect" className="h-10 w-full rounded-xl" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-5 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)] flex flex-col items-center justify-center text-center">
          <Skeleton variant="circle" className="w-12 h-12 mb-3" />
          <Skeleton variant="text" className="h-8 w-16 mb-2" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
