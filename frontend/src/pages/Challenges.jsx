import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Target, Award, CheckCircle2, 
  Flame, Shield, Star, Rocket, Clock,
  ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/common/EmptyState';
import { ChallengeCardSkeleton } from '../components/common/Skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const { apiLoading, get } = useApi();
  const [filter, setFilter] = useState('active'); // 'active' | 'completed'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChallenges = async () => {
      const data = await get('/auth/me');
      if (data) {
        setChallenges(data.challenges || []);
        setStats(data.stats);
      }
    };

    fetchChallenges();
  }, []);

  const filteredChallenges = challenges.filter(c => 
    filter === 'active' ? !c.isCompleted : c.isCompleted
  );

  const completionRate = challenges.length > 0 
    ? Math.round((challenges.filter(c => c.isCompleted).length / challenges.length) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <Target className="w-7 h-7 text-[var(--color-primary)]" />
            Civic Quests
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 font-medium">
            Complete challenges to earn XP and unlock exclusive community badges.
          </p>
        </div>

        <div className="flex bg-[var(--color-surface-container-low)] p-1 rounded-xl w-fit border border-[var(--color-outline-variant)]/30">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'active'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            Active ({challenges.filter(c => !c.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            Completed ({challenges.filter(c => c.isCompleted).length})
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-primary)] text-white p-5 rounded-[var(--radius-2xl)] shadow-lg flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="absolute right-[-10%] top-[-10%] opacity-10">
            <Rocket className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Season Progress</p>
            <h2 className="text-3xl font-black mt-1">{completionRate}%</h2>
          </div>
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden border border-white/10 relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
        </motion.div>

        {stats && (
          <>
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 p-5 rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft-1)] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Impact Score</p>
                <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.impactScore}</p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 p-5 rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft-1)] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                <Flame className="w-6 h-6 fill-orange-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Active Streak</p>
                <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.streak} Days</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Challenges Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {apiLoading ? (
            Array(4).fill(0).map((_, i) => (
              <ChallengeCardSkeleton key={i} />
            ))
          ) : filteredChallenges.length > 0 ? (
            filteredChallenges.map((challenge, index) => (
              <ChallengeCard key={challenge.title} challenge={challenge} isCompleted={filter === 'completed'} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                preset={filter === 'active' ? 'challengesActive' : 'challengesCompleted'} 
                onResetFilter={() => setFilter('active')}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function ChallengeCard({ challenge, isCompleted }) {
  const progressPercent = Math.round((challenge.progress / challenge.target) * 100);
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className={`relative group overflow-hidden bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-2xl)] p-5 border shadow-[var(--shadow-soft-1)] transition-all ${
        isCompleted 
          ? 'border-green-100 dark:border-green-900/30' 
          : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)]/50'
      }`}
    >
      {/* Background Decorative Icon */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
        {challenge.title.includes('Road') ? <Shield className="w-40 h-40" /> : 
         challenge.title.includes('Civic') ? <Rocket className="w-40 h-40" /> : 
         <Target className="w-40 h-40" />}
      </div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-[var(--color-on-surface)] truncate group-hover:text-[var(--color-primary)] transition-colors">
            {challenge.title}
          </h3>
          <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-0.5 leading-relaxed">
            {challenge.description}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shrink-0 ${
          isCompleted ? 'bg-green-100 text-green-700' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
        }`}>
          {isCompleted ? (
            <><CheckCircle2 className="w-3 h-3" /> Claimed</>
          ) : (
            <><Zap className="w-3 h-3 text-amber-500" /> {challenge.xpReward} XP</>
          )}
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-black text-[var(--color-on-surface)]">
            {challenge.progress} <span className="opacity-40">/ {challenge.target}</span>
          </span>
          <span className={`text-xs font-black ${isCompleted ? 'text-green-600' : 'text-[var(--color-primary)]'}`}>
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)]'
            }`}
          />
        </div>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 bg-green-50/10 dark:bg-green-900/5 pointer-events-none" />
      )}
    </motion.div>
  );
}
