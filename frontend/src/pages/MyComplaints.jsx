import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Filter, Search, Clock, CheckCircle2,
  ArrowUpDown, ChevronDown, Inbox, Radio, AlertTriangle, RefreshCw
} from 'lucide-react';
import ComplaintCard from '../components/layout/ComplaintCard';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { getAssetUrl } from '../config/constants';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { Virtuoso } from 'react-virtuoso';
import EmptyState from '../components/common/EmptyState';
import { ComplaintCardSkeleton } from '../components/common/Skeleton';

// ─── Status Filter Tabs ─────────────────────────
const STATUS_TABS = [
  { key: 'All',         label: 'All',         icon: null,         dot: 'bg-[var(--color-primary)]' },
  { key: 'Pending',     label: 'Pending',     icon: AlertCircle,  dot: 'bg-red-500' },
  { key: 'In Progress', label: 'In Progress', icon: Clock,        dot: 'bg-amber-500' },
  { key: 'Resolved',    label: 'Resolved',    icon: CheckCircle2, dot: 'bg-green-500' },
];

// ─── Sort Options ───────────────────────────────
const SORT_OPTIONS = [
  { key: 'newest',   label: 'Newest First' },
  { key: 'oldest',   label: 'Oldest First' },
  { key: 'priority', label: 'Priority' },
  { key: 'upvotes',  label: 'Most Upvoted' },
];

// ─── Animation Presets ──────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const { loading: apiLoading, error, get } = useApi();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const [statusCounts, setStatusCounts] = useState({ All: 0, Pending: 0, 'In Progress': 0, Resolved: 0 });
  const [totalComplaints, setTotalComplaints] = useState(0);

  // Real-time socket updates
  useSocket({
    onNewComplaint: (comp) => {
      const formatted = {
        ...comp,
        id: comp._id,
        location: `${comp.city || 'Kolkata'}, ${comp.pincode || ''}`.trim().replace(/,$/, ''),
        timeAgo: 'Just now',
        comments: 0,
        imageUrl: getAssetUrl(comp.photo)
      };
      setComplaints(prev => [formatted, ...prev]);
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 2500);
    },
    onStatusUpdate: (data) => {
      setComplaints(prev => prev.map(c =>
        c.id === data.id || c._id === data.id ? { ...c, status: data.status } : c
      ));
    },
    onUpvoteUpdate: (data) => {
      setComplaints(prev => prev.map(c =>
        c.id === data.id || c._id === data.id ? { ...c, upvotes: data.upvotes } : c
      ));
    },
    onFollowUpdate: (data) => {
      setComplaints(prev => prev.map(c =>
        c.id === data.id || c._id === data.id ? { ...c, followers: data.followers } : c
      ));
    },
    onVerifyUpdate: (data) => {
      setComplaints(prev => prev.map(c =>
        c.id === data.id || c._id === data.id ? { ...c, verifications: data.verifications } : c
      ));
    },
    onNewComment: (data) => {
      setComplaints(prev => prev.map(c => 
        c.id === data.complaintId || c._id === data.complaintId ? { ...c, comments: (c.comments || 0) + 1 } : c
      ));
    },
    onDeleteComment: (data) => {
      setComplaints(prev => prev.map(c => 
        c.id === data.complaintId || c._id === data.complaintId ? { ...c, comments: Math.max(0, (c.comments || 0) - 1) } : c
      ));
    }
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        sortBy,
        status: activeFilter,
        search: debouncedSearch,
        limit: 50 // Fetch up to 50 for now
      }).toString();

      const data = await get(`/complaints?${queryParams}`);
      if (data && data.complaints) {
        const formatted = data.complaints.map(comp => ({
          ...comp,
          id: comp._id,
          location: `${comp.city || 'Kolkata'}, ${comp.pincode || ''}`.trim().replace(/,$/, ''),
          lat: Number(comp.location?.coordinates?.[1]) || 22.5726,
          lng: Number(comp.location?.coordinates?.[0]) || 88.3639,
          timeAgo: getRelativeTime(comp.createdAt),
          comments: 0,
          imageUrl: getAssetUrl(comp.photo)
        }));
        setComplaints(formatted);
        if (data.counts) setStatusCounts(data.counts);
        if (data.pagination) setTotalComplaints(data.pagination.total);

        // Cache the default view for offline support
        if (activeFilter === 'All' && !debouncedSearch && sortBy === 'newest') {
          await idbSet('civicseva_cached_complaints', {
            complaints: formatted,
            counts: data.counts,
            total: data.pagination?.total
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      // Fallback to cache on error
      if (activeFilter === 'All' && !debouncedSearch && sortBy === 'newest') {
        const cached = await idbGet('civicseva_cached_complaints');
        if (cached) {
          try {
            setComplaints(cached.complaints || []);
            if (cached.counts) setStatusCounts(cached.counts);
            if (cached.total) setTotalComplaints(cached.total);
          } catch (e) {
            console.error("Failed to parse cache", e);
          }
        }
      }
    }
  }, [get, activeFilter, sortBy, debouncedSearch]);

  useEffect(() => {
    // Load cache initially if empty to prevent empty state flash
    const loadCache = async () => {
      if (complaints.length === 0 && activeFilter === 'All' && !debouncedSearch && sortBy === 'newest') {
        const cached = await idbGet('civicseva_cached_complaints');
        if (cached) {
          try {
            setComplaints(cached.complaints || []);
            if (cached.counts) setStatusCounts(cached.counts);
            if (cached.total) setTotalComplaints(cached.total);
          } catch (e) {
            console.error("Failed to parse cache", e);
          }
        }
      }
    };
    loadCache();
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-5 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* ─── Page Header ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-[var(--color-primary)]" />
            My Complaints
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
            Track and manage all your reported civic issues
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {liveFlash && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full"
            >
              <Radio className="w-3 h-3 animate-pulse" /> Live update
            </motion.span>
          )}
          <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
            {statusCounts.Pending} pending
          </span>
          <span className="text-xs font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
            {statusCounts['In Progress']} active
          </span>
          <span className="text-xs font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-full">
            {statusCounts.Resolved} resolved
          </span>
        </div>
      </div>


      {/* ─── Filter + Search Bar ──────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-[var(--radius-xl)] flex-1 overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const isActive = activeFilter === tab.key;
            const count = statusCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-lg)] text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[var(--color-on-surface)] shadow-[var(--shadow-soft-1)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.dot} ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[var(--color-surface-container)] text-[var(--color-on-surface)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 w-44"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-xs font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
              <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-soft-3)] border border-[var(--color-outline-variant)]/30 py-1 z-20 min-w-[150px]"
                >
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      onClick={() => { setSortBy(option.key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                        sortBy === option.key
                          ? 'bg-[var(--color-primary-container)]/30 text-[var(--color-primary)] font-semibold'
                          : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Results Header ──────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">
          <Filter className="w-3.5 h-3.5 inline mr-1" />
          Showing {complaints.length} of {totalComplaints} complaints
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* ─── Complaints List ─────────────── */}
      {error ? (
        <div className="w-full flex flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] p-8 text-center gap-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/30 mt-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Unable to Load Complaints</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{error}</p>
          </div>
          <button 
            onClick={fetchComplaints}
            className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary)]/90 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : apiLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <ComplaintCardSkeleton key={i} />
          ))}
        </div>
      ) : complaints.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 min-h-[500px]"
        >
          <Virtuoso
            style={{ height: '100%', width: '100%' }}
            data={complaints}
            itemContent={(index, complaint) => (
              <div className="pb-3 px-1">
                <motion.div variants={itemVariants}>
                  <ComplaintCard complaint={complaint} />
                </motion.div>
              </div>
            )}
          />
        </motion.div>
      ) : (
        <EmptyState 
          preset={searchQuery ? 'searchNoResults' : activeFilter !== 'All' ? 'filterEmpty' : 'complaints'} 
          onClearSearch={() => setSearchQuery('')}
          onResetFilter={() => setActiveFilter('All')}
        />
      )}
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
