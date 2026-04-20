import { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Clock, ArrowUp, MessageSquare, ChevronDown, ChevronUp, AlertTriangle, Bell, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import CommentThread from './CommentThread';
import ComplaintTimeline from './ComplaintTimeline';

const VERIFICATION_THRESHOLD = 3;

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', accent: '#f59e0b' },
  'In Progress': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500', accent: '#3b82f6' },
  Resolved: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500', accent: '#22c55e' },
};

const CATEGORY_COLORS = {
  Roads: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  Water: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  Garbage: { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-400' },
  Electricity: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  Drainage: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
  Others: { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400' },
};

// ─── Severity Indicator ─────────────────────────
const SeverityDots = memo(function SeverityDots({ priorityScore = 0 }) {
  const level = priorityScore >= 15 ? 5 : priorityScore >= 10 ? 4 : priorityScore >= 7 ? 3 : priorityScore >= 4 ? 2 : 1;
  
  return (
    <div className="flex items-center gap-0.5" title={`Priority: ${priorityScore}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i <= level
              ? level >= 4 ? 'bg-red-500' : level >= 3 ? 'bg-amber-500' : 'bg-green-500'
              : 'bg-[var(--color-surface-container-high)]'
          }`}
        />
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════
// COMPLAINT CARD COMPONENT
// ═══════════════════════════════════════════════
function ComplaintCard({ complaint, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [showImpactAnimation, setShowImpactAnimation] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(complaint?.upvotes || 0);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();

  const {
    _id,
    title = 'Untitled Issue',
    category = 'Others',
    location = 'Unknown location',
    timeAgo = '',
    comments = 0,
    status = 'Pending',
    description = '',
    imageUrl = null,
    priorityScore = 0,
    followers = [],
    verifications = [],
    timeline = [],
    user: complaintOwnerId,
  } = complaint || {};

  const [impactMessage, setImpactMessage] = useState('+2 Impact');
  const [impactSource, setImpactSource] = useState(null);

  const [isFollowing, setIsFollowing] = useState(
    isAuthenticated && user && Array.isArray(followers) ? followers.includes(user._id || user.id) : false
  );
  const [followersCount, setFollowersCount] = useState(followers?.length || 0);
  const [followLoading, setFollowLoading] = useState(false);

  const [isVerifiedByMe, setIsVerifiedByMe] = useState(
    isAuthenticated && user && Array.isArray(verifications) ? verifications.includes(user._id || user.id) : false
  );
  const [verificationsCount, setVerificationsCount] = useState(verifications?.length || 0);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Sync state with props for real-time updates
  useEffect(() => {
    const safeFollowers = Array.isArray(followers) ? followers : [];
    setFollowersCount(safeFollowers.length);
    setIsFollowing(isAuthenticated && user && safeFollowers.length > 0 ? safeFollowers.includes(user._id || user.id) : false);
  }, [followers, isAuthenticated, user]);

  useEffect(() => {
    const safeVerifications = Array.isArray(verifications) ? verifications : [];
    setVerificationsCount(safeVerifications.length);
    setIsVerifiedByMe(isAuthenticated && user && safeVerifications.length > 0 ? safeVerifications.includes(user._id || user.id) : false);
  }, [verifications, isAuthenticated, user]);

  useEffect(() => {
    setUpvoteCount(complaint?.upvotes || 0);
  }, [complaint?.upvotes]);

  const isOwner = user && (user._id === complaintOwnerId || user.id === complaintOwnerId || user._id === complaintOwnerId?._id || user.id === complaintOwnerId?._id);

  const statusStyle = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const categoryStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.Others;

  const handleUpvote = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: locationState } });
      return;
    }

    if (upvoteLoading || !_id) return;
    setUpvoteLoading(true);

    // Optimistic UI
    setUpvoted(prev => !prev);
    setUpvoteCount(prev => upvoted ? Math.max(0, prev - 1) : prev + 1);

    try {
      const data = await api.post(`/complaints/${_id}/upvote`);
      setUpvoteCount(data.upvotes);
      if (data.message === 'Upvote added') {
        setUpvoted(true);
        setImpactMessage('+2 Impact');
        setImpactSource('upvote');
        setShowImpactAnimation(true);
        setTimeout(() => { setShowImpactAnimation(false); setImpactSource(null); }, 2000);
      } else {
        setUpvoted(false);
      }
    } catch (error) {
      // Rollback on failure
      setUpvoted(prev => !prev);
      setUpvoteCount(prev => upvoted ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setUpvoteLoading(false);
    }
  }, [isAuthenticated, _id, upvoteLoading, upvoted, navigate, locationState]);

  const handleCommentToggle = useCallback((e) => {
    e.stopPropagation();
    setShowComments(prev => !prev);
  }, []);

  const handleFollow = useCallback(async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: locationState } });
      return;
    }
    if (followLoading || !_id) return;
    setFollowLoading(true);

    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => wasFollowing ? Math.max(0, prev - 1) : prev + 1);

    try {
      const data = await api.post(`/complaints/${_id}/follow`);
      setIsFollowing(data.message === 'Followed');
      setFollowersCount(data.followers.length);
    } catch (error) {
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, _id, followLoading, isFollowing, navigate, locationState]);

  const handleVerify = useCallback(async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: locationState } });
      return;
    }
    
    if (isOwner) {
      alert('You cannot verify your own complaint.');
      return;
    }

    if (verifyLoading || !_id) return;
    setVerifyLoading(true);

    const wasVerified = isVerifiedByMe;
    setIsVerifiedByMe(!isVerifiedByMe);
    setVerificationsCount(prev => wasVerified ? Math.max(0, prev - 1) : prev + 1);

    try {
      const data = await api.post(`/complaints/${_id}/verify`);
      if (data.message === 'Verified') {
        setIsVerifiedByMe(true);
        setImpactMessage('+3 Impact');
        setImpactSource('verify');
        setShowImpactAnimation(true);
        setTimeout(() => { setShowImpactAnimation(false); setImpactSource(null); }, 2000);
      } else {
        setIsVerifiedByMe(false);
      }
      setVerificationsCount(data.verifications.length);
    } catch (error) {
      alert(error.message || 'Error verifying');
      setIsVerifiedByMe(wasVerified);
      setVerificationsCount(prev => wasVerified ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setVerifyLoading(false);
    }
  }, [isAuthenticated, isOwner, _id, verifyLoading, isVerifiedByMe, navigate, locationState]);

  const handleExpandToggle = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  const handleCloseComments = useCallback(() => {
    setShowComments(false);
  }, []);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-1)] hover:shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 overflow-hidden transition-shadow"
    >
      {/* Status accent bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: statusStyle.accent }} />

      <div className={compact ? 'p-3' : 'p-4'}>
        {/* ─── Header: Category + Status + Severity ─── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${categoryStyle.bg} ${categoryStyle.text}`}>
              {category}
            </span>
            <SeverityDots priorityScore={priorityScore} />
            {verificationsCount >= VERIFICATION_THRESHOLD && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 shrink-0" title={`${verificationsCount} Community Verifications`}>
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${status === 'Pending' ? 'animate-pulse' : ''}`} />
            {status}
          </span>
        </div>

        {/* ─── Content: Image + Text ─── */}
        <div className="flex gap-3 mb-3">
          {imageUrl && (
            <div className="w-[72px] h-[72px] rounded-[var(--radius-lg)] overflow-hidden shrink-0 bg-[var(--color-surface-container)]">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-on-surface-variant)]"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-[var(--color-on-surface)] leading-snug line-clamp-2 mb-1.5">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] mb-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-on-surface-variant)]">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{timeAgo}</span>
              {priorityScore > 8 && (
                <span className="flex items-center gap-0.5 ml-2 text-amber-600 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  High Priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Expandable Description & Timeline ─── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {description && (
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed pb-3 border-b border-[var(--color-outline-variant)]/20 mb-3">
                  {description}
                </p>
              )}
              
              {/* Timeline */}
              {timeline && timeline.length > 0 && (
                <div className="pb-3 mb-3">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-xs font-black text-[var(--color-on-surface)] uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                        Resolution Transparency Timeline
                      </h4>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 ml-6">
                        Verified audit trail of civic action and authority responses.
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-tighter">
                        Immutable Record
                      </span>
                    </div>
                  </div>

                  <ComplaintTimeline timeline={timeline} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Footer: Actions ─── */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-outline-variant)]/20">
          <div className="flex items-center gap-1">
            {/* Upvote button — real API call */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleUpvote}
              disabled={upvoteLoading}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                upvoted
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              } ${upvoteLoading ? 'opacity-60 cursor-wait' : ''}`}
            >
              <AnimatePresence>
                {showImpactAnimation && impactSource === 'upvote' && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1.1 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 1 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-amber-500 font-bold text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md shadow-md border border-amber-200 z-10 pointer-events-none"
                  >
                    {impactMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              <ArrowUp className={`w-3.5 h-3.5 transition-transform ${upvoted ? 'scale-110' : ''}`} />
              {upvoteCount}
            </motion.button>

            {/* Comments toggle button */}
            <button
              onClick={handleCommentToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                showComments
                  ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {comments}
            </button>

            {/* Follow Button */}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isFollowing
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              } ${followLoading ? 'opacity-60 cursor-wait' : ''}`}
              title={isFollowing ? 'Unfollow Issue' : 'Follow Issue'}
            >
              <Bell className="w-3.5 h-3.5" />
              {followersCount}
            </button>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={verifyLoading || isOwner}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isVerifiedByMe
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              } ${verifyLoading || isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
              title={isOwner ? 'You cannot verify your own complaint' : (isVerifiedByMe ? 'Remove Verification' : 'Verify Issue')}
            >
              <AnimatePresence>
                {showImpactAnimation && impactSource === 'verify' && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1.1 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 1 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-amber-500 font-bold text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md shadow-md border border-amber-200 z-10 pointer-events-none"
                  >
                    {impactMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              <ShieldCheck className="w-3.5 h-3.5" />
              {verificationsCount}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(description || (timeline && timeline.length > 0)) && (
              <button
                onClick={handleExpandToggle}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                {isExpanded ? (
                  <>Less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>More <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─── Comment Thread (toggled) ─── */}
        <AnimatePresence>
          {showComments && _id && (
            <CommentThread
              key={_id}
              complaintId={_id}
              onClose={() => setShowComments(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default memo(ComplaintCard);
