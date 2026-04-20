import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Trophy, Medal, Star, TrendingUp,
  Flame, Target, Users, Crown, Zap, Shield,
  Building2, Clock, CheckCircle2, BarChart3,
  AlertTriangle, MapPin, ArrowUp
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Skeleton } from '../components/common/Skeleton';

// ─── Mock Data ──────────────────────────────────
const MOCK_LEADERS = [
  { id: 1, name: 'Anshuman Jha',   avatar: 'AJ', reports: 24, resolved: 18, upvotes: 156, streak: 12, badge: 'Civic Champion' },
  { id: 2, name: 'Priya Sharma',    avatar: 'PS', reports: 19, resolved: 14, upvotes: 132, streak: 8,  badge: 'Guardian' },
  { id: 3, name: 'Rahul Gupta',     avatar: 'RG', reports: 17, resolved: 15, upvotes: 98,  streak: 15, badge: 'Streak Master' },
  { id: 4, name: 'Sneha Das',       avatar: 'SD', reports: 15, resolved: 11, upvotes: 87,  streak: 5,  badge: 'Rising Star' },
  { id: 5, name: 'Arjun Patel',     avatar: 'AP', reports: 13, resolved: 9,  upvotes: 76,  streak: 7,  badge: 'Watchdog' },
];

const MOCK_AUTHORITIES = [
  { id: 1, name: 'KMC Solid Waste Mgmt', avatar: 'WM', total: 480, resolved: 450, sla: 1.2, trend: '+5%', rating: 4.8 },
  { id: 2, name: 'Kolkata Traffic Police', avatar: 'TP', total: 200, resolved: 180, sla: 1.5, trend: '+2%', rating: 4.6 },
  { id: 3, name: 'CESC (Electricity)',   avatar: 'CE', total: 600, resolved: 510, sla: 1.8, trend: '-1%', rating: 4.3 },
  { id: 4, name: 'KMC Water Supply',     avatar: 'WS', total: 360, resolved: 280, sla: 2.5, trend: '+4%', rating: 4.0 },
  { id: 5, name: 'KMC Roads Dept',       avatar: 'RD', total: 300, resolved: 190, sla: 4.5, trend: '-3%', rating: 3.5 },
];

// ─── Badge Configuration ────────────────────────
const BADGE_STYLES = {
  'Civic Champion': { icon: Crown,  bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  'Guardian':       { icon: Shield, bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  'Streak Master':  { icon: Flame,  bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  'Rising Star':    { icon: Star,   bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200' },
  'Watchdog':       { icon: Target, bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200' },
  'Contributor':    { icon: Users,  bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200' },
};

const RANK_STYLES = {
  1: { bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', text: 'text-white', icon: Trophy },
  2: { bg: 'bg-gradient-to-br from-gray-300 to-slate-400',   text: 'text-white', icon: Medal },
  3: { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', text: 'text-white', icon: Medal },
};

// ─── Animation ──────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// ═══════════════════════════════════════════════
// LEADERBOARD PAGE
// ═══════════════════════════════════════════════
export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('citizens'); // 'citizens' | 'authorities'
  const [leaders, setLeaders] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [platformSummary, setPlatformSummary] = useState(null);
  const [needsAttention, setNeedsAttention] = useState([]);
  const { loading: apiLoading, get } = useApi();
  const [sortKey, setSortKey] = useState('impact');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch for better performance
        const [leaderboardData, authorityData, attentionData] = await Promise.all([
          get('/users/leaderboard').catch(() => MOCK_LEADERS),
          get('/authority/stats').catch(() => null),
          get('/authority/needs-attention').catch(() => [])
        ]);

        if (leaderboardData) setLeaders(leaderboardData);
        
        if (authorityData) {
          setPlatformSummary(authorityData.summary);
          setAuthorities(authorityData.departmentStats.map((dept, i) => ({
            id: i + 1,
            name: dept.department,
            avatar: dept.department.charAt(0).toUpperCase(),
            total: dept.total,
            resolved: dept.resolved,
            sla: parseFloat(dept.avgSLA) || 0,
            targetSla: 3.0,
            efficiency: dept.efficiencyScore || 0,
            trend: resolutionTrend(dept.resolutionRate),
            rating: (dept.resolutionRate / 20).toFixed(1)
          })));
        }

        if (attentionData) setNeedsAttention(attentionData);

      } catch (error) {
        console.error("Leaderboard fetch error:", error);
      }
    };
    fetchData();
  }, [get]);

  const resolutionTrend = (rate) => {
    if (rate >= 80) return '+5%';
    if (rate >= 60) return '+2%';
    if (rate >= 40) return '-1%';
    return '-3%';
  };

  // Citizens compute
  const sortedLeaders = useMemo(() => {
    const withScores = leaders.map(l => ({
      ...l,
      impactScore: (l.reports * 10) + (l.resolved * 15) + (l.upvotes * 2) + (l.streak * 5)
    }));
    switch (sortKey) {
      case 'reports':  return [...withScores].sort((a, b) => b.reports - a.reports);
      case 'resolved': return [...withScores].sort((a, b) => b.resolved - a.resolved);
      case 'upvotes':  return [...withScores].sort((a, b) => b.upvotes - a.upvotes);
      default:         return [...withScores].sort((a, b) => b.impactScore - a.impactScore);
    }
  }, [leaders, sortKey]);

  // Platform stats
  const platformStats = useMemo(() => {
    const totals = leaders.reduce(
      (acc, l) => ({
        reports: acc.reports + l.reports,
        resolved: acc.resolved + l.resolved,
        upvotes: acc.upvotes + l.upvotes,
      }),
      { reports: 0, resolved: 0, upvotes: 0 }
    );
    return { ...totals, activeUsers: leaders.length };
  }, [leaders]);

  // Authority compute
  const sortedAuthorities = useMemo(() => {
    return [...authorities].sort((a, b) => (b.resolved / b.total) - (a.resolved / a.total));
  }, [authorities]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-5 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* ─── Header & Main Tabs ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Civic Leaderboard
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
            Recognizing top contributors and tracking authority performance
          </p>
        </div>

        {/* Top-level Tabs */}
        <div className="flex bg-[var(--color-surface-container-low)] p-1 rounded-[var(--radius-xl)] w-fit">
          <button
            onClick={() => setActiveTab('citizens')}
            className={`flex items-center gap-2 px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold transition-all ${
              activeTab === 'citizens'
                ? 'bg-white text-[var(--color-on-surface)] shadow-[var(--shadow-soft-1)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            <Users className="w-4 h-4" /> Citizens
          </button>
          <button
            onClick={() => setActiveTab('authorities')}
            className={`flex items-center gap-2 px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold transition-all ${
              activeTab === 'authorities'
                ? 'bg-white text-[var(--color-on-surface)] shadow-[var(--shadow-soft-1)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            <Building2 className="w-4 h-4" /> Authorities
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'citizens' ? (
          <motion.div
            key="citizens"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            {/* Citizens Content */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Active Citizens', value: platformStats.activeUsers, icon: Users, color: 'text-[var(--color-primary)]' },
                { label: 'Total Reports',   value: platformStats.reports,     icon: Award, color: 'text-amber-600' },
                { label: 'Issues Resolved', value: platformStats.resolved,    icon: Target, color: 'text-green-600' },
                { label: 'Community Upvotes', value: platformStats.upvotes,   icon: Star, color: 'text-purple-600' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-4 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]"
                >
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  {apiLoading ? (
                    <Skeleton className="h-7 w-16 mb-1 mt-1 rounded-md" />
                  ) : (
                    <p className="text-2xl font-bold text-[var(--color-on-surface)]">{stat.value}</p>
                  )}
                  <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-[var(--radius-xl)] overflow-x-auto scrollbar-hide">
              {[
                { key: 'impact',   label: 'Impact Score', icon: TrendingUp },
                { key: 'reports',  label: 'Reports',      icon: Award },
                { key: 'resolved', label: 'Resolved',     icon: Target },
                { key: 'upvotes',  label: 'Upvotes',      icon: Star },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSortKey(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-lg)] text-xs font-semibold transition-all whitespace-nowrap ${
                    sortKey === tab.key
                      ? 'bg-white text-[var(--color-on-surface)] shadow-[var(--shadow-soft-1)]'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {apiLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-xl)]" />
                ))}
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                {sortedLeaders.map((leader, index) => {
                  const rank = index + 1;
                  const rankStyle = RANK_STYLES[rank];
                  const badgeConfig = BADGE_STYLES[leader.badge] || BADGE_STYLES['Contributor'];
                  const BadgeIcon = badgeConfig.icon;
                  const resolutionRate = leader.reports > 0 ? Math.round((leader.resolved / leader.reports) * 100) : 0;

                  return (
                    <motion.div
                      key={leader.id}
                      variants={itemVariants}
                      className={`flex items-center gap-4 p-4 rounded-[var(--radius-xl)] border transition-all ${
                        rank <= 3
                          ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)]/40 shadow-[var(--shadow-soft-2)]'
                          : 'bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                        rankStyle ? `${rankStyle.bg} ${rankStyle.text}` : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
                      }`}>
                        {rankStyle ? <rankStyle.icon className="w-5 h-5" /> : <span>{rank}</span>}
                      </div>

                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        rank === 1 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                      }`}>
                        {leader.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">{leader.name}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {leader.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-[var(--color-on-surface-variant)]">
                          <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" />{leader.reports} reports</span>
                          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-green-500" />{resolutionRate}% resolved</span>
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{leader.streak}d streak</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[var(--color-on-surface)]">{leader.impactScore}</p>
                        <p className="text-[10px] font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">Score</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="authorities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            {/* SLA Analytics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { 
                  label: 'City Avg SLA', 
                  value: platformSummary ? `${platformSummary.overallResolutionRate > 70 ? '2.1' : '4.5'} Days` : '...', 
                  icon: Clock, 
                  color: 'text-blue-600', 
                  sub: 'Target: 3.0 Days' 
                },
                { 
                  label: 'Overall Resolution', 
                  value: platformSummary ? `${platformSummary.overallResolutionRate}%` : '...', 
                  icon: CheckCircle2, 
                  color: 'text-green-600', 
                  sub: `+${platformSummary?.resolvedLastWeek || 0} this week` 
                },
                { 
                  label: 'Total Handled', 
                  value: platformSummary ? platformSummary.totalComplaints.toLocaleString() : '...', 
                  icon: BarChart3, 
                  color: 'text-purple-600', 
                  sub: `Across ${authorities.length} Depts` 
                },
                { 
                  label: 'Top Dept', 
                  value: authorities[0]?.name || '...', 
                  icon: Building2, 
                  color: 'text-amber-600', 
                  sub: `${authorities[0]?.sla || 0} Days Avg SLA` 
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-4 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]"
                >
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-xl font-bold text-[var(--color-on-surface)]">{stat.value}</p>
                  <p className="text-xs font-semibold text-[var(--color-on-surface)] mt-0.5">{stat.label}</p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Resolution Trend & Most Improved Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {platformSummary?.monthlyTrends && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-soft-1)]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)]">Resolution Trends</h3>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)]">Last 6 months resolved issues</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <TrendingUp className="w-3 h-3" />
                        Improving
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between h-32 gap-2 mt-4 px-2">
                    {platformSummary.monthlyTrends.map((trend, i) => {
                      const maxVal = Math.max(...platformSummary.monthlyTrends.map(t => t.resolved), 1);
                      const height = (trend.resolved / maxVal) * 100;
                      
                      return (
                        <div key={trend.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="relative w-full flex justify-center">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                              className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                                i === platformSummary.monthlyTrends.length - 1 
                                  ? 'bg-[var(--color-primary)]' 
                                  : 'bg-[var(--color-primary-container)] group-hover:bg-[var(--color-primary-container-high)]'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)]">{trend.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {platformSummary?.mostImprovedAreas && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-soft-1)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)]">Most Improved Areas</h3>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)]">Top performing pincodes this month</p>
                    </div>
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                  
                  <div className="space-y-3">
                    {platformSummary.mostImprovedAreas.map((area, i) => (
                      <div key={area.pincode} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-container-low)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] shadow-sm">
                            {area.pincode}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-on-surface)]">Zone {area.pincode.slice(-3)}</p>
                            <p className="text-[10px] text-[var(--color-on-surface-variant)]">Resolution Score: {area.currentRate}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-green-600">+{area.delta}%</p>
                          <p className="text-[8px] text-[var(--color-on-surface-variant)] uppercase font-bold">Improvement</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Authorities List */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-blue-500" />
                Department Performance Rankings
              </h3>
              <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-black tracking-widest">Ranked by resolution efficiency and SLA adherence</p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
              {sortedAuthorities.map((dept, index) => {
                const rank = index + 1;
                const resolutionRate = Math.round((dept.resolved / dept.total) * 100);
                const isMeetingSla = dept.sla <= dept.targetSla;

                return (
                  <motion.div
                    key={dept.id}
                    variants={itemVariants}
                    className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-soft-1)] flex flex-col lg:flex-row gap-6 lg:items-center group hover:border-[var(--color-primary)]/30 transition-all"
                  >
                    {/* Rank & Avatar */}
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        rank === 1 ? 'bg-amber-100 text-amber-700' : 
                        rank === 2 ? 'bg-slate-100 text-slate-700' : 
                        rank === 3 ? 'bg-orange-100 text-orange-700' : 
                        'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
                      }`}>
                        #{rank}
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                        {dept.avatar}
                      </div>
                    </div>

                    {/* Info & SLA Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-[var(--color-on-surface)] truncate">{dept.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          {dept.rating}
                        </div>
                      </div>

                      {/* Main Resolution Progress */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] text-[var(--color-on-surface-variant)] font-black uppercase tracking-tighter mb-1.5">
                            <span>Resolution Progress</span>
                            <span>{dept.resolved} / {dept.total} • {resolutionRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${resolutionRate}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${resolutionRate >= 85 ? 'bg-green-500' : resolutionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            />
                          </div>
                        </div>

                        {/* SLA Analytics Mini-bars */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-[9px] text-[var(--color-on-surface-variant)] font-bold uppercase mb-1">
                              <span>Efficiency</span>
                              <span>{dept.efficiency}%</span>
                            </div>
                            <div className="w-full h-1 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dept.efficiency}%` }}
                                className="h-full bg-blue-500/60"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-[var(--color-on-surface-variant)] font-bold uppercase mb-0.5">SLA Adherence</div>
                            <div className={`text-[10px] font-black ${isMeetingSla ? 'text-green-600' : 'text-red-600'}`}>
                              {isMeetingSla ? 'Within Target' : 'Needs Optimization'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Sidebar (Vertical on Desktop) */}
                    <div className="flex flex-row lg:flex-col gap-4 lg:gap-3 lg:min-w-[140px] lg:pl-6 lg:border-l lg:border-[var(--color-outline-variant)]/20">
                      <div className="flex-1 lg:text-right">
                        <p className="text-[9px] text-[var(--color-on-surface-variant)] font-black uppercase tracking-widest mb-0.5">Avg SLA</p>
                        <p className={`text-sm font-black flex items-center lg:justify-end gap-1.5 ${isMeetingSla ? 'text-green-600' : 'text-orange-600'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {dept.sla}d
                        </p>
                      </div>
                      <div className="flex-1 lg:text-right">
                        <p className="text-[9px] text-[var(--color-on-surface-variant)] font-black uppercase tracking-widest mb-0.5">Trend</p>
                        <p className={`text-sm font-black flex items-center lg:justify-end gap-1.5 ${dept.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          {dept.trend}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Needs Civic Attention Section */}
            {needsAttention.length > 0 && (
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Areas Needing Civic Attention
                  </h3>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-black tracking-widest">High-priority issues with significant community impact</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {needsAttention.map((issue) => (
                    <motion.div
                      key={issue._id}
                      whileHover={{ y: -4 }}
                      className="bg-[var(--color-surface-container-lowest)] border border-amber-200/50 rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-soft-1)] flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                          {issue.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <ArrowUp className="w-3 h-3" />
                          {issue.upvotes} Votes
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--color-on-surface)] line-clamp-1">{issue.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--color-on-surface-variant)] mt-auto">
                        <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                        <span>Pincode: {issue.pincode || 'Unknown'}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

