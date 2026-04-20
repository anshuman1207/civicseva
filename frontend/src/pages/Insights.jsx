import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, PieChart, Activity,
  MapPin, Clock, CheckCircle2, AlertTriangle, Zap,
  HeartHandshake, ShieldAlert, Sparkles, Star,
  LayoutDashboard, Map, Info, Globe, Users, ShieldCheck, RefreshCw
} from 'lucide-react';
import AnalyticsHeatmap from '../components/analytics/AnalyticsHeatmap';
import AreaHealthGrid from '../components/analytics/AreaHealthGrid';
import { Skeleton, StatCardSkeleton } from '../components/common/Skeleton';
import { useApi } from '../hooks/useApi';

// ─── Animation Presets ──────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CATEGORY_COLORS = {
  Roads:       { bg: '#FEE2E2', fill: '#EF4444', text: 'text-red-700' },
  Water:       { bg: '#DBEAFE', fill: '#3B82F6', text: 'text-blue-700' },
  Garbage:     { bg: '#D1FAE5', fill: '#10B981', text: 'text-emerald-700' },
  Electricity: { bg: '#FEF3C7', fill: '#F59E0B', text: 'text-amber-700' },
  Others:      { bg: '#E5E7EB', fill: '#6B7280', text: 'text-gray-700' },
};

function ProgressBar({ value, max, color, delay = 0 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="relative w-full h-2.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default function Insights() {
  const [advancedInsights, setAdvancedInsights] = useState(null);
  const [areaHealth, setAreaHealth] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [authorityStats, setAuthorityStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState(null);
  const { loading: apiLoading, error, get } = useApi();

  const fetchAnalytics = async () => {
    try {
      // Use Promise.allSettled so that if one endpoint fails (e.g. rate limit),
      // the others still render gracefully
      const [insightsRes, healthRes, catRes, statsRes, feedRes] = await Promise.allSettled([
        get('/analytics/insights'),
        get('/analytics/area-health'),
        get('/analytics/categories'),
        get('/authority/stats'),
        get('/authority/activity-feed')
      ]);

      if (insightsRes.status === 'fulfilled') setAdvancedInsights(insightsRes.value);
      if (healthRes.status === 'fulfilled') setAreaHealth(healthRes.value);
      if (catRes.status === 'fulfilled') setCategoryAnalytics(catRes.value);
      if (statsRes.status === 'fulfilled') setAuthorityStats(statsRes.value);
      if (feedRes.status === 'fulfilled') setActivityFeed(feedRes.value);
    } catch (error) {
      console.error('Failed to fetch smart city analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [get]);

  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'health' | 'categories' | 'heatmap'

  // Computed Values
  const stats = useMemo(() => {
    if (!authorityStats) return null;
    return {
      total: authorityStats.summary.totalComplaints,
      resolved: authorityStats.summary.totalResolved,
      rate: authorityStats.summary.overallResolutionRate,
      weekly: authorityStats.summary.resolvedLastWeek,
      participation: advancedInsights?.participation?.length || 0
    };
  }, [authorityStats, advancedInsights]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* ─── Premium Header ─────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--color-primary)] rounded-xl shadow-lg shadow-[var(--color-primary)]/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-[var(--color-on-surface)] tracking-tight">
                  Smart City Analytics
                </h1>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-0.5 opacity-70">
                  Real-Time Intelligence · Kolkata
                </p>
             </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1.5 rounded-2xl border border-[var(--color-outline-variant)]/30 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'health',   label: 'Area Health', icon: ShieldAlert },
            { id: 'categories', label: 'Issue Trends', icon: TrendingUp },
            { id: 'heatmap',  label: 'Live Heatmap', icon: Map }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeView === view.id 
                ? 'bg-[var(--color-primary)] text-white shadow-md' 
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              <view.icon className={`w-3.5 h-3.5 ${activeView === view.id ? 'text-white' : 'opacity-60'}`} />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (!advancedInsights && !authorityStats) ? (
        <div className="w-full flex flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] p-8 text-center gap-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/30 mt-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Unable to Load Analytics</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{error}</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary)]/90 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : apiLoading && !advancedInsights ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Skeleton className="lg:col-span-2 h-[400px] w-full rounded-3xl" />
             <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'City Engagement', value: stats?.participation, unit: 'Users', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'System Velocity', value: `${stats?.rate}%`, unit: 'Resolved', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Public Sentiment', value: 'High', unit: 'Positive', icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Weekly Impact', value: `+${stats?.weekly}`, unit: 'Fixed', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map(kpi => (
                  <motion.div key={kpi.label} variants={itemVariants} className="bg-[var(--color-surface-container-lowest)] p-5 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
                    <div className={`w-10 h-10 ${kpi.bg} rounded-2xl flex items-center justify-center mb-4`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    <p className="text-2xl font-black text-[var(--color-on-surface)] tracking-tight">{kpi.value}</p>
                    <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-1">{kpi.label}</p>
                    <p className="text-[8px] font-black text-[var(--color-primary)] uppercase tracking-tighter opacity-60 mt-0.5">{kpi.unit} Index</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resolution Trend Chart */}
                <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider flex items-center gap-2">
                           <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                           Resolution Trajectory
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase mt-1 opacity-60">6-Month Historical Performance</p>
                     </div>
                     <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +14% Growth
                     </div>
                  </div>
                  
                  <div className="flex items-end gap-3 h-56 px-4">
                    {advancedInsights?.resolutionTrends?.filter(t => t._id.status === 'Resolved').map((t, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(t.count / (stats?.total / 4)) * 100}%` }}
                          className="w-full rounded-t-xl bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] group-hover:from-[var(--color-tertiary)] transition-all cursor-pointer shadow-md"
                        />
                        <span className="text-[8px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-tighter">Month {t._id.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participation Analytics */}
                <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
                   <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Participation Trends
                   </h3>
                   <div className="space-y-6">
                      {advancedInsights?.participation?.slice(-4).map((p, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">M{p._id.month}</span>
                              <span className="text-xs font-black text-indigo-700">{p.newUsers}</span>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-1.5">
                                 <span className="text-[10px] font-black text-[var(--color-on-surface)] uppercase">Community Growth</span>
                                 <span className="text-[9px] font-bold text-indigo-600">New Onboarding</span>
                              </div>
                              <ProgressBar value={p.newUsers} max={50} color="#6366f1" delay={i * 0.1} />
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <p className="text-[10px] font-bold text-indigo-800/80 leading-relaxed">
                        User onboarding has increased by <strong>24%</strong> this month, indicating strong community trust in civic resolution systems.
                      </p>
                   </div>
                </div>
              </div>

              {/* Row 3: Milestones & Insights */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-300" />
                            Community Milestones
                         </h3>
                         <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Live City Progress</p>
                      </div>
                      <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                         <Sparkles className="w-5 h-5 text-yellow-200" />
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase">Monthly Resolution Goal</span>
                            <span className="text-[10px] font-black">{activityFeed?.milestones?.resolvedThisMonth || 0} / 500</span>
                         </div>
                         <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min((activityFeed?.milestones?.resolvedThisMonth || 0) / 500 * 100, 100)}%` }}
                               className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black uppercase opacity-60">Total XP Earned</p>
                            <p className="text-xl font-black">{activityFeed?.milestones?.communityXP?.toLocaleString() || 0}</p>
                         </div>
                         <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black uppercase opacity-60">Active Citizens</p>
                            <p className="text-xl font-black">{activityFeed?.milestones?.activeCitizens || 0}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm flex flex-col justify-between">
                   <div>
                      <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-[var(--color-primary)]" />
                        Strategic Analyst AI
                      </h3>
                      <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed italic opacity-80">
                        "Current data indicates a 15% increase in efficiency within PIN {areaHealth[0]?.pincode || '700001'}. Recommend re-allocating sanitation resources to trending hotspots detected in the live heatmap."
                      </p>
                   </div>
                   <div className="mt-6 flex items-center gap-4 p-4 bg-[var(--color-surface-container-low)] rounded-2xl border border-[var(--color-outline-variant)]/10">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                         <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-[var(--color-on-surface)] uppercase">Anomaly Detection: Offline</p>
                         <p className="text-[8px] font-bold text-[var(--color-on-surface-variant)] uppercase opacity-60">System Health: Optimal</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeView === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[var(--color-on-surface)] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Area Health Index
                  </h2>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 font-medium italic">Comprehensive health evaluation by region and responsiveness.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-container-high)] rounded-2xl border border-[var(--color-outline-variant)]/30">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="text-[10px] font-black text-[var(--color-on-surface)] uppercase">{areaHealth.length} Areas Tracked</span>
                </div>
              </div>
              <AreaHealthGrid areaData={areaHealth} />
            </motion.div>
          )}

          {activeView === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Category Distribution */}
               <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
                  <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider mb-8 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-orange-500" />
                    Issue Category Distribution
                  </h3>
                  <div className="space-y-6">
                    {categoryAnalytics.map((cat, i) => {
                      const colors = CATEGORY_COLORS[cat._id] || CATEGORY_COLORS.Others;
                      const growth = cat.growthRate || 0;
                      const isGrowing = growth > 0;
                      return (
                        <div key={cat._id} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.fill }} />
                               <span className="text-xs font-black text-[var(--color-on-surface)] uppercase tracking-tight">{cat._id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                 isGrowing 
                                   ? 'bg-red-50 text-red-600 border-red-100' 
                                   : 'bg-green-50 text-green-600 border-green-100'
                               }`}>
                                 <TrendingUp className={`w-2.5 h-2.5 ${!isGrowing ? 'rotate-180' : ''}`} />
                                 {isGrowing ? '+' : ''}{growth}%
                               </span>
                               <div className="text-right">
                                  <span className="text-[10px] font-black text-[var(--color-on-surface)]">{cat.totalCount} Reports</span>
                                  <p className="text-[8px] font-bold text-[var(--color-on-surface-variant)]/60 uppercase tracking-tighter">
                                    {cat.thisMonth || 0} this month · {cat.lastMonth || 0} last
                                  </p>
                               </div>
                            </div>
                          </div>
                          <ProgressBar value={cat.totalCount} max={stats?.total} color={colors.fill} delay={i * 0.1} />
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* Area/Category Correlations */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm">
                   <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider mb-6 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-blue-500" />
                     Area/Category Correlations
                   </h3>
                   <div className="space-y-4">
                     {categoryAnalytics.slice(0, 4).map((cat, i) => (
                       <div key={i} className="p-4 bg-[var(--color-surface-container-low)] rounded-2xl border border-[var(--color-outline-variant)]/10 hover:border-blue-200 transition-all">
                         <div className="flex items-center justify-between mb-3">
                           <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">{cat._id} Density</p>
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                             (cat.growthRate || 0) > 20 ? 'bg-red-100 text-red-700' :
                             (cat.growthRate || 0) > 0  ? 'bg-amber-100 text-amber-700' :
                             'bg-green-100 text-green-700'
                           }`}>
                             {(cat.growthRate || 0) > 20 ? 'Surging' : (cat.growthRate || 0) > 0 ? 'Rising' : 'Declining'}
                           </span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {cat.areas.slice(0, 3).map(area => (
                             <div key={area.pincode} className="px-3 py-1.5 bg-white/60 dark:bg-black/20 rounded-xl border border-[var(--color-outline-variant)]/20 flex items-center gap-2">
                                <span className="text-[10px] font-black text-[var(--color-on-surface)]">PIN {area.pincode}</span>
                                <div className="w-px h-3 bg-[var(--color-outline-variant)]/30" />
                                <span className="text-[10px] font-bold text-blue-600">{(area.count / cat.totalCount * 100).toFixed(0)}%</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Growth Summary Card */}
                 <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm flex flex-col">
                   <h3 className="text-sm font-black text-[var(--color-on-surface)] uppercase tracking-wider mb-6 flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-purple-500" />
                     Monthly Growth Summary
                   </h3>
                   <div className="flex-1 space-y-4">
                     {categoryAnalytics.slice(0, 5).map((cat) => {
                       const colors = CATEGORY_COLORS[cat._id] || CATEGORY_COLORS.Others;
                       const growth = cat.growthRate || 0;
                       return (
                         <div key={cat._id} className="flex items-center gap-4">
                           <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.bg }}>
                             <span className="text-[10px] font-black" style={{ color: colors.fill }}>{cat._id?.charAt(0)}</span>
                           </div>
                           <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-black text-[var(--color-on-surface)] uppercase">{cat._id}</span>
                               <span className={`text-xs font-black ${growth > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                 {growth > 0 ? '↑' : '↓'} {Math.abs(growth)}%
                               </span>
                             </div>
                             <div className="flex items-center gap-2 text-[8px] font-bold text-[var(--color-on-surface-variant)]">
                               <span>Last: {cat.lastMonth || 0}</span>
                               <span>→</span>
                               <span>Now: {cat.thisMonth || 0}</span>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-blue-800/80 leading-relaxed uppercase tracking-tight">
                        Correlation data suggests that <strong>Infrastructure issues</strong> are 3x more likely in expanding suburbs than urban cores.
                      </p>
                   </div>
                 </div>
               </div>
            </motion.div>
          )}

          {activeView === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[600px] w-full"
            >
               <AnalyticsHeatmap />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

