import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, User, Loader2, X, Reply } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../utils/api';

// ─── Individual Comment ────────────────────────────
function CommentItem({ comment, replies, onDelete, onReply, currentUserId }) {
  const canDelete = currentUserId && comment.userId?._id === currentUserId;
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="flex gap-2.5 group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          {comment.userId?.name?.charAt(0)?.toUpperCase() || <User className="w-3 h-3" />}
        </div>

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--color-surface-container)] rounded-[var(--radius-lg)] rounded-tl-sm px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-[var(--color-primary)]">
                {comment.userId?.name || 'Citizen'}
              </span>
              <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-on-surface)] leading-relaxed">{comment.text}</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-[10px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Reply className="w-2.5 h-2.5" />
              Reply
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(comment._id)}
                className="flex items-center gap-1 text-[10px] text-[var(--color-on-surface-variant)] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="flex flex-col gap-2 ml-9 pl-2 border-l-2 border-[var(--color-surface-container-highest)]">
          <AnimatePresence initial={false}>
            {replies.map(reply => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                key={reply._id}
                className="flex gap-2 group"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {reply.userId?.name?.charAt(0)?.toUpperCase() || <User className="w-2.5 h-2.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[var(--color-surface-container-low)] rounded-[var(--radius-lg)] rounded-tl-sm px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-[var(--color-primary)]">
                        {reply.userId?.name || 'Citizen'}
                      </span>
                      <span className="text-[9px] text-[var(--color-on-surface-variant)]">
                        {timeAgo(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-on-surface)] leading-relaxed">{reply.text}</p>
                  </div>
                  {currentUserId && reply.userId?._id === currentUserId && (
                    <button
                      onClick={() => onDelete(reply._id)}
                      className="mt-0.5 ml-1 flex items-center gap-1 text-[9px] text-[var(--color-on-surface-variant)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// COMMENT THREAD PANEL
// ═══════════════════════════════════════════════════
export default function CommentThread({ complaintId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { _id, userName }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Subscribe to real-time comment events
  useSocket({
    onNewComment: (data) => {
      if (data.complaintId === complaintId) {
        setComments(prev => {
          // Prevent duplicates
          if (prev.find(c => c._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
      }
    },
    onDeleteComment: (data) => {
      if (data.complaintId === complaintId) {
        setComments(prev => prev.filter(c => c._id !== data.commentId && c.parentCommentId !== data.commentId));
      }
    }
  });

  useEffect(() => {
    if (!complaintId) return;
    setLoading(true);
    api.get(`/complaints/${complaintId}/comments`)
      .then(data => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [complaintId]);

  // Group comments into parents and replies
  const parentComments = comments.filter(c => !c.parentCommentId);
  const repliesByParent = comments.filter(c => c.parentCommentId).reduce((acc, curr) => {
    if (!acc[curr.parentCommentId]) acc[curr.parentCommentId] = [];
    acc[curr.parentCommentId].push(curr);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: locationState } });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = { text: trimmed };
      if (replyTo) {
        payload.parentCommentId = replyTo._id;
      }

      const data = await api.post(`/complaints/${complaintId}/comments`, payload);
      
      setComments(prev => [...prev, data]);
      setText('');
      setReplyTo(null);
      
      // Auto-scroll logic if it's a new parent comment
      if (!replyTo) {
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (commentId) => {
    if (!user?.token) return;
    try {
      await api.delete(`/comments/${commentId}`);
      // Remove comment and any of its children from state
      setComments(prev => prev.filter(c => c._id !== commentId && c.parentCommentId !== commentId));
    } catch {
      // silently fail
    }
  };

  const handleReplyClick = (comment) => {
    setReplyTo({ _id: comment._id, userName: comment.userId?.name || 'Citizen' });
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden border-t border-[var(--color-outline-variant)]/20 mt-2"
    >
      <div className="pt-3 pb-1">
        {/* Thread header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--color-on-surface)]">
              Civic Discussion ({loading ? '…' : comments.length})
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--color-surface-container-high)] transition-colors">
              <X className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />
            </button>
          )}
        </div>

        {/* Comment list */}
        <div
          ref={listRef}
          className="flex flex-col gap-3 max-h-56 overflow-y-auto scrollbar-hide mb-3 pr-1"
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-5">
              <MessageSquare className="w-6 h-6 mx-auto mb-1.5 text-[var(--color-on-surface-variant)] opacity-40" />
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                No civic discussions yet. Start one!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {parentComments.map(comment => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  replies={repliesByParent[comment._id]}
                  onDelete={handleDelete}
                  onReply={handleReplyClick}
                  currentUserId={user?._id}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 mb-2 px-1">{error}</p>
        )}

        {/* Input area */}
        {isAuthenticated ? (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence>
              {replyTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="flex items-center justify-between bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-[10px] px-2 py-1 rounded-t-md mx-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Reply className="w-3 h-3" />
                    Replying to <span className="font-semibold text-[var(--color-on-surface)]">{replyTo.userName}</span>
                  </span>
                  <button onClick={() => setReplyTo(null)} className="hover:text-[var(--color-on-surface)]">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative z-10 bg-[var(--color-surface)]">
              <div className="w-7 h-7 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-[10px] shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className={`flex-1 flex items-center gap-2 bg-[var(--color-surface-container)] rounded-full px-3 py-1.5 border transition-colors ${replyTo ? 'border-[var(--color-primary)]/50 rounded-tl-none' : 'border-[var(--color-outline-variant)]/30 focus-within:border-[var(--color-primary)]/50'}`}>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={replyTo ? "Write a reply…" : "Add to discussion…"}
                  maxLength={500}
                  className="flex-1 text-xs bg-transparent outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || submitting}
                  className="text-[var(--color-primary)] disabled:opacity-30 transition-opacity"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login', { state: { from: locationState } })}
            className="w-full text-xs text-center py-2 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/20 transition-all"
          >
            Sign in to join discussion
          </button>
        )}
      </div>
    </motion.div>
  );
}
