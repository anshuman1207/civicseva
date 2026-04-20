import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowUp, AlertCircle, ShieldCheck, CheckCircle2, User, Clock, TrendingUp, Star, MapPin } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';

const getIcon = (type) => {
  switch (type) {
    case 'report': return <AlertCircle className="w-4 h-4 text-error" />;
    case 'upvote': return <ArrowUp className="w-4 h-4 text-orange-500" />;
    case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'status_update': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'verification': return <ShieldCheck className="w-4 h-4 text-green-500" />;
    case 'milestone': return <CheckCircle2 className="w-4 h-4 text-amber-500" />;
    default: return <User className="w-4 h-4 text-gray-500" />;
  }
};

const getRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Memoized individual item to prevent re-renders of the whole list
const ActivityItem = memo(({ activity }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`p-3 mb-2 rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-container)] transition-colors group relative ${
        activity.type === 'milestone' 
          ? 'bg-amber-500/5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
          : ''
      }`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center border border-[var(--color-outline-variant)]/10 group-hover:border-[var(--color-primary)]/30 transition-colors">
            {getIcon(activity.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-on-surface)] leading-snug">
            <span className={`font-bold ${activity.type === 'milestone' ? 'text-amber-500' : 'text-[var(--color-primary)]'}`}>
              {activity.userName}
            </span>{' '}
            {activity.action || (activity.type === 'report' ? 'reported' : activity.type === 'upvote' ? 'upvoted' : activity.type === 'comment' ? 'commented on' : activity.type === 'status_update' ? 'updated status of' : activity.type === 'verification' ? 'verified' : 'acted on')}{' '}
            <span className="font-medium text-[var(--color-on-surface-variant)]">
              "{activity.complaintTitle}"
            </span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[var(--color-on-surface-variant)] flex items-center gap-1">
              <Clock size={10} />
              {getRelativeTime(activity.createdAt || activity.time)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ActivityItem.displayName = 'ActivityItem';

const ActivityFeed = memo(() => {
  const [activities, setActivities] = useState([]);
  const [highlights, setHighlights] = useState(null);
  const { loading: apiLoading, get } = useApi();

  const [location, setLocation] = useState(null);

  const fetchActivities = async (lat, lon) => {
    try {
      const activitiesData = await get('/activities');
      setActivities(activitiesData);

      // Fetch Highlights with location if available
      let url = `/authority/activity-feed`;
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      
      const highlightsData = await get(url);
      setHighlights(highlightsData);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lon: longitude });
          fetchActivities(latitude, longitude);
        },
        () => {
          fetchActivities();
        }
      );
    } else {
      fetchActivities();
    }
  }, []);

  useSocket({
    onNewActivity: (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 30));
    }
  });

  if (apiLoading && activities.length === 0) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--color-surface-container-high)] rounded w-3/4" />
              <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/10 shadow-[var(--shadow-soft-2)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)]/50">
        <h3 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Community Feed
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* Community Milestones Section */}
        {highlights?.milestones && (
          <div className="px-2 mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Solved', value: highlights.milestones.resolvedThisMonth, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Community XP', value: highlights.milestones.communityXP, icon: Star, color: 'text-amber-500' },
              { label: 'Active', value: highlights.milestones.activeCitizens, icon: User, color: 'text-blue-500' }
            ].map((m, i) => (
              <div key={i} className="bg-white/50 dark:bg-black/20 p-2 rounded-xl border border-[var(--color-outline-variant)]/5 text-center">
                <m.icon className={`w-3.5 h-3.5 ${m.color} mx-auto mb-1`} />
                <p className="text-xs font-black text-[var(--color-on-surface)] leading-none">{m.value}</p>
                <p className="text-[8px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-tighter mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Trending Section */}
        {highlights?.trendingIssues?.length > 0 && (
          <div className="px-2 mb-4">
            <h4 className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              Trending Civic Issues
            </h4>
            <div className="space-y-1.5">
              {highlights.trendingIssues.map((issue) => (
                <div key={issue._id} className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-bold text-[var(--color-on-surface)] truncate">{issue.title}</p>
                    <p className="text-[9px] text-[var(--color-on-surface-variant)]">{issue.category} • Zone {issue.pincode?.slice(-3)}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-0.5 text-[10px] font-black text-amber-600">
                    <ArrowUp size={10} />
                    {issue.upvotes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Updates Section */}
        {highlights?.nearbyUpdates?.length > 0 && (
          <div className="px-2 mb-4">
            <h4 className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-blue-500" />
              Nearby Updates
            </h4>
            <div className="space-y-1.5">
              {highlights.nearbyUpdates.map((update) => (
                <div key={update._id} className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-bold text-[var(--color-on-surface)] truncate">{update.title}</p>
                    <p className="text-[9px] text-[var(--color-on-surface-variant)]">{update.category} • {update.status}</p>
                  </div>
                  <div className="shrink-0 text-[8px] font-bold text-[var(--color-on-surface-variant)]/60">
                    {getRelativeTime(update.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-2 mb-2">
          <h4 className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-[var(--color-primary)]" />
            Live Activity Feed
          </h4>
        </div>

        <AnimatePresence initial={false}>
          {activities.map((activity, index) => (
            <ActivityItem key={activity._id || index} activity={activity} />
          ))}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
            <p className="text-sm italic opacity-50">Quiet in the city today...</p>
          </div>
        )}
      </div>
    </div>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;
