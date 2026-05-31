import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, 
  MapPin, ArrowRight, Plus, TrendingUp, Users, 
  Shield, Zap, ChevronRight, Eye, Star, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ComplaintCard from '../components/layout/ComplaintCard';
import MapContainer from '../components/map/MapContainer';
import ActivityFeed from '../components/layout/ActivityFeed';
import ProgressionStats from '../components/layout/ProgressionStats';
import GamificationCenter from '../components/layout/GamificationCenter';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { getAssetUrl } from '../config/constants';
import { useNotification } from '../context/NotificationContext';
import { DashboardSkeleton, ComplaintCardSkeleton, Skeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ComponentErrorBoundary from '../components/common/ComponentErrorBoundary';
import ShowcaseBanner from '../components/demo/ShowcaseBanner';
import { useDemo } from '../context/DemoContext';

// ─── Animation Presets ──────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// ─── Stat Card Component ────────────────────────
const StatCard = React.memo(({ label, value, icon: Icon, color, bg, trend, trendLabel, apiLoading }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-soft-1)] hover:shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 flex flex-col gap-3 transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend !== undefined && !apiLoading && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        {apiLoading ? (
          <div className="h-7 w-12 bg-[var(--color-surface-container-high)] rounded-md animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">{value}</p>
        )}
        <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-0.5">{trendLabel || label}</p>
      </div>
    </motion.div>
  );
});

// ─── Quick Action Button ────────────────────────
const QuickAction = React.memo(({ icon: Icon, label, description, onClick, color = 'var(--color-primary)' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-1)] hover:shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 transition-all text-left w-full group"
    >
      <div 
        className="w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-on-surface)] leading-tight">{label}</p>
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
    </motion.button>
  );
});

// ─── Community Pulse Card ───────────────────────
const CommunityPulse = React.memo(({ total, resolved, pending, inProgress }) => {
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  
  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--color-primary)]" />
          Community Pulse
        </h3>
        <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">This month</span>
      </div>
      
      {/* Resolution rate progress */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">Resolution Rate</span>
          <span className="text-lg font-bold text-[var(--color-on-surface)]">{resolutionRate}%</span>
        </div>
        <div className="h-2.5 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resolutionRate}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, var(--color-primary), var(--color-success))`
            }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pending', value: pending, color: '#EF4444' },
          { label: 'In Progress', value: inProgress, color: '#F59E0B' },
          { label: 'Resolved', value: resolved, color: '#22C55E' },
        ].map(item => (
          <div key={item.label} className="text-center p-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)]">
            <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: item.color }} />
            <p className="text-base font-bold text-[var(--color-on-surface)]">{item.value}</p>
            <p className="text-[10px] font-medium text-[var(--color-on-surface-variant)]">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

// ─── Nearby Alert Item ──────────────────────────
const NearbyAlert = React.memo(({ complaint, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityColors = {
    Roads: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800/30' },
    Water: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800/30' },
    Electricity: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/30' },
    Garbage: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500', border: 'border-green-200 dark:border-green-800/30' },
    Others: { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500', border: 'border-gray-200 dark:border-gray-700/50' },
  };
  const s = severityColors[complaint.category] || severityColors.Others;

  return (
    <div className="w-full text-left p-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-container-low)] transition-colors group">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-[var(--color-on-surface)] ${isExpanded ? '' : 'truncate'}`}>
            {complaint.title}
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
            <span className={isExpanded ? '' : 'truncate'}>{complaint.location}</span>
          </p>
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${s.bg} ${s.text} ${s.border}`}>
          {complaint.category}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-[var(--color-outline-variant)]/10 space-y-3">
              {complaint.description && (
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed font-normal bg-[var(--color-surface-container-low)] p-2.5 rounded-[var(--radius-md)]">
                  {complaint.description}
                </p>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status:</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-surface-container)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/20`}>
                    {complaint.status}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-dim)] text-[10px] font-bold uppercase rounded-lg shadow-sm transition-colors active:scale-95 duration-200"
                >
                  View on Map
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ═══════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════
export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
  const [liveFlash, setLiveFlash] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'priority'
  const navigate = useNavigate();
  const { loading: apiLoading, get } = useApi();
  const [userProfile, setUserProfile] = useState(null);

  // ── Real-time socket handlers ──
  useSocket({
    onNewComplaint: (comp) => {
      const formattedComp = {
        ...comp,
        id: comp._id,
        location: `${comp.city || 'Kolkata'}, ${comp.pincode || ''}`.trim().replace(/,$/, ''),
        description: comp.description || '',
        lat: Number(comp.location?.coordinates?.[1]) || 22.5726,
        lng: Number(comp.location?.coordinates?.[0]) || 88.3639,
        timeAgo: 'Just now',
        comments: 0,
        imageUrl: getAssetUrl(comp.photo)
      };
      setRecentActivity(prev => [formattedComp, ...prev.slice(0, 49)]);
      setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
      // Flash indicator
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 2000);
    },
    onUpvoteUpdate: (data) => {
      setRecentActivity(prev => prev.map(comp =>
        comp.id === data.id ? { ...comp, upvotes: data.upvotes, priorityScore: data.priorityScore } : comp
      ));
    },
    onStatusUpdate: (data) => {
      setRecentActivity(prev => {
        let oldStatus = '';
        const updated = prev.map(comp => {
          if (comp.id === data.id) { 
            oldStatus = comp.status; 
            return { 
              ...comp, 
              status: data.status,
              ...(data.timeline && { timeline: data.timeline })
            }; 
          }
          return comp;
        });
        if (oldStatus && oldStatus !== data.status) {
          setStats(s => {
            const n = { ...s };
            if (oldStatus === 'Resolved') n.resolved = Math.max(0, n.resolved - 1);
            if (oldStatus === 'In Progress') n.inProgress = Math.max(0, n.inProgress - 1);
            if (oldStatus === 'Pending') n.pending = Math.max(0, n.pending - 1);
            if (data.status === 'Resolved') n.resolved++;
            if (data.status === 'In Progress') n.inProgress++;
            if (data.status === 'Pending') n.pending++;
            return n;
          });
        }
        return updated;
      });
    },
    onNewComment: (data) => {
      setRecentActivity(prev => prev.map(comp => 
        comp.id === data.complaintId ? { ...comp, comments: (comp.comments || 0) + 1 } : comp
      ));
    },
    onDeleteComment: (data) => {
      setRecentActivity(prev => prev.map(comp => 
        comp.id === data.complaintId ? { ...comp, comments: Math.max(0, (comp.comments || 0) - 1) } : comp
      ));
    },
    onFollowUpdate: (data) => {
      setRecentActivity(prev => prev.map(comp =>
        comp.id === data.id ? { ...comp, followers: data.followers } : comp
      ));
    },
    onVerifyUpdate: (data) => {
      setRecentActivity(prev => prev.map(comp =>
        comp.id === data.id ? { ...comp, verifications: data.verifications } : comp
      ));
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      const apiSort = sortBy === 'trending' ? 'priority' : 'recent';
      
      try {
        // Parallel fetch using standardized useApi hook
        // profileData is optional (guest view), errors in complaints will trigger toast
        const [data, profileData] = await Promise.all([
          get(`/complaints?sortBy=${apiSort}`),
          get('/auth/me').catch(() => null)
        ]);

        const complaints = Array.isArray(data) ? data : data.complaints || [];
        const formatted = complaints.map(comp => ({
          id: comp._id,
          title: comp.title,
          location: comp.address || `${comp.location?.coordinates?.[1]?.toFixed(4) || 0}, ${comp.location?.coordinates?.[0]?.toFixed(4) || 0}`,
          description: comp.description || '',
          lat: Number(comp.location?.coordinates?.[1]) || 22.5726,
          lng: Number(comp.location?.coordinates?.[0]) || 88.3639,
          category: comp.category,
          status: comp.status,
          upvotes: comp.upvotes || 0,
          comments: comp.comments?.length || 0,
          followers: comp.followers || [],
          verifications: comp.verifications || [],
          priorityScore: comp.priorityScore || 0,
          imageUrl: getAssetUrl(comp.photo),
          timeline: comp.timeline || [],
          pincode: comp.pincode,
          createdAt: comp.createdAt
        }));
        
        setRecentActivity(formatted);
        setUserProfile(profileData);
        
        // Derive stats
        if (data && data.counts) {
          setStats({
            total: data.counts.All || 0,
            resolved: data.counts.Resolved || 0,
            inProgress: data.counts['In Progress'] || 0,
            pending: data.counts.Pending || 0
          });
        } else {
          const total = formatted.length;
          const resolved = formatted.filter(c => c.status === 'Resolved').length;
          const inProgress = formatted.filter(c => c.status === 'In Progress').length;
          const pending = formatted.filter(c => c.status === 'Pending').length;
          setStats({ total, resolved, inProgress, pending });
        }

      } catch (error) {
        // useApi already shows a toast, we just log it for debugging
        console.error("Dashboard fetch error:", error);
      }
    };
    fetchData();
  }, [sortBy, get]); // Added get to dependencies

  const nearbyAlerts = useMemo(() => 
    recentActivity
      .filter(c => c.status === 'Pending' || c.status === 'In Progress')
      .slice(0, 5),
    [recentActivity]
  );

  const displayedActivity = useMemo(() => {
    if (sortBy === 'resolutions') {
      return recentActivity.filter(c => c.status === 'Resolved');
    }
    return recentActivity;
  }, [recentActivity, sortBy]);

  const handleReportIssue = useCallback(() => navigate('/map'), [navigate]);
  const handleExploreMap = useCallback(() => navigate('/map'), [navigate]);
  const handleMyComplaints = useCallback(() => navigate('/complaints'), [navigate]);
  const handleLeaderboard = useCallback(() => navigate('/leaderboard'), [navigate]);

  const { isDemoMode, isPresentationMode } = useDemo();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-5 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* ─── Showcase Banner (Demo Mode) ───── */}
      {isDemoMode && (
        <ShowcaseBanner stats={{ total: stats.total, rate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 78, users: '200+' }} />
      )}
      {/* ─── Header ──────────────────────── */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
            Real-time civic pulse of your city
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-medium transition-colors duration-500 ${
          liveFlash ? 'text-green-600 font-semibold' : 'text-[var(--color-on-surface-variant)]'
        }`}>
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              liveFlash ? 'bg-green-400' : 'bg-emerald-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              liveFlash ? 'bg-green-500' : 'bg-emerald-500'
            }`} />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-wider">
            {liveFlash ? 'New report!' : 'Live City Pulse'}
          </span>
        </div>
      </motion.div>

      {userProfile && (
        <ComponentErrorBoundary name="User Profile">
          <ProgressionStats user={userProfile} />
        </ComponentErrorBoundary>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0"
      >
        <StatCard
          label="Total Reported"
          value={stats.total}
          apiLoading={apiLoading}
          icon={AlertTriangle}
          color="text-[var(--color-on-warning-container)]"
          bg="bg-[var(--color-warning-container)]"
          trend={12}
          trendLabel="Total reports filed"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          apiLoading={apiLoading}
          icon={CheckCircle2}
          color="text-[var(--color-on-success-container)]"
          bg="bg-[var(--color-success-container)]"
          trend={8}
          trendLabel="Issues resolved"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          apiLoading={apiLoading}
          icon={Clock}
          color="text-[var(--color-on-primary-container)]"
          bg="bg-[var(--color-primary-container)]"
          trendLabel="Being addressed"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          apiLoading={apiLoading}
          icon={Zap}
          color="text-red-600"
          bg="bg-red-50"
          trendLabel="Awaiting action"
        />
      </motion.div>

      {/* ─── Quick Actions + Community Pulse ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0"
      >
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--color-primary)]" />
            Quick Actions
          </h2>
          <ComponentErrorBoundary name="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                icon={Plus}
                label="Report New Issue"
                description="Submit a civic complaint with photos"
                onClick={handleReportIssue}
                color="var(--color-primary)"
              />
              <QuickAction
                icon={MapPin}
                label="Explore Live Map"
                description="View all issues on an interactive map"
                onClick={handleExploreMap}
                color="#22C55E"
              />
              <QuickAction
                icon={Eye}
                label="My Complaints"
                description="Track status of your reports"
                onClick={handleMyComplaints}
                color="#F59E0B"
              />
              <QuickAction
                icon={Users}
                label="Leaderboard"
                description="See top community contributors"
                onClick={handleLeaderboard}
                color="#8B5CF6"
              />
            </div>
          </ComponentErrorBoundary>
        </motion.div>

        {/* Community Pulse */}
        <ComponentErrorBoundary name="Community Pulse">
          <CommunityPulse
            total={stats.total}
            resolved={stats.resolved}
            pending={stats.pending}
            inProgress={stats.inProgress}
          />
        </ComponentErrorBoundary>
      </motion.div>

      {/* ─── Main Content: Activity + Nearby + Map ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-[420px] shrink-0">
        
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
                Activity Feed
              </h2>
              
              {/* Sort Toggle */}
              <div className="bg-[var(--color-surface-container-low)] p-0.5 rounded-lg flex flex-wrap gap-1 border border-[var(--color-outline-variant)]/50">
                {[
                  { id: 'recent', label: 'All Updates' },
                  { id: 'resolutions', label: 'Resolutions' },
                  { id: 'trending', label: 'Trending' },
                  { id: 'milestones', label: 'Milestones' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                      sortBy === option.id 
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {recentActivity.length > 3 && (
              <button
                onClick={() => navigate('/complaints')}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {apiLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <ComplaintCardSkeleton key={i} />
                ))}
              </div>
            ) : (() => {
              if (sortBy === 'milestones') {
                return (
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-[var(--radius-xl)] border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <Award className="w-24 h-24 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-2 relative z-10">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Community Milestone: 100+ Resolutions
                      </h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 relative z-10 leading-relaxed">
                        Kolkata citizens and authorities have successfully resolved over 100 civic issues this month! The fastest resolution time was achieved in Ward 12. Great job keeping the city clean and safe!
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-[var(--radius-xl)] border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <Users className="w-24 h-24 text-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-2 relative z-10">
                        <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        500 Active Citizens
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 relative z-10 leading-relaxed">
                        Our platform has reached 500 active civic champions! The community is growing stronger and more vigilant every day.
                      </p>
                    </motion.div>
                  </div>
                );
              }

              if (displayedActivity.length > 0) {
                return displayedActivity.slice(0, 5).map((complaint) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  >
                    <ComplaintCard complaint={complaint} />
                  </motion.div>
                ));
              } else {
                return (
                  <EmptyState preset="activity" />
                );
              }
            })()}
          </div>
        </div>

        {/* Right Column: Nearby Alerts + Map Preview */}
        <div className="flex flex-col gap-4">
          {/* Nearby Alerts */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/30"
          >
            <h3 className="text-sm font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Nearby Alerts
              {nearbyAlerts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  {nearbyAlerts.length} active
                </span>
              )}
            </h3>
            {apiLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full rounded-[var(--radius-lg)]" />
                ))}
              </div>
            ) : nearbyAlerts.length > 0 ? (
              <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                {nearbyAlerts.map(alert => (
                  <NearbyAlert key={alert.id} complaint={alert} onClick={() => navigate('/map')} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-on-surface-variant)] text-center py-4">
                🎉 No active issues nearby!
              </p>
            )}
          </motion.div>

          <div className="flex-1 min-h-[350px]">
            <GamificationCenter user={userProfile} />
          </div>

          <div className="h-[480px]">
            <ComponentErrorBoundary name="Activity Feed">
              <ActivityFeed />
            </ComponentErrorBoundary>
          </div>

          {/* Mini Map Preview */}
          <div className="h-[200px] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 relative z-0">
            <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-[var(--color-outline-variant)]/30">
              <p className="text-[10px] font-bold text-[var(--color-on-surface)] tracking-wide uppercase">
                Live Map · {recentActivity.length} markers
              </p>
            </div>
            <ComponentErrorBoundary name="Live Map">
              <MapContainer readOnly={true} markers={recentActivity} />
            </ComponentErrorBoundary>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Utility ────────────────────────────────────
function getRelativeTime(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}
