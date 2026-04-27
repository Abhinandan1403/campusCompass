import { useState } from 'react';
import { ArrowUp, CheckCircle, Trash2, MapPin, ChevronRight, Shield, Eye, EyeOff, Send, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { postAPI, placeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function CommentItem({ comment, onDelete, onAccept, postAuthorId }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [upvoteCount, setUpvoteCount] = useState(comment.upvoteCount || comment.upvotes?.length || 0);
  const [isUpvoted, setIsUpvoted] = useState(comment.isUpvoted || false);

  const isOwner = user?._id === (comment.author?._id || comment.author);
  const isPostAuthor = user?._id === postAuthorId;
  const displayAuthor = comment.isAnonymous
    ? { name: 'Anonymous Student', isStudentVerified: false }
    : comment.author;

  const handleUpvote = async () => {
    if (!isAuthenticated) { toast.info('Sign in to upvote'); return; }
    try {
      const res = await postAPI.toggleCommentUpvote(comment._id);
      setIsUpvoted(res.data.data.isUpvoted);
      setUpvoteCount(res.data.data.upvoteCount);
    } catch { toast.error('Could not vote'); }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${
      comment.isAccepted
        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20'
        : 'border-default bg-surface'
    }`}>
      {comment.isAccepted && (
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-green-600 dark:text-green-400">
          <CheckCircle size={13} className="fill-current" />
          Accepted Answer
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
          ${comment.isAnonymous ? 'bg-gray-400' : 'bg-gradient-to-br from-campus-400 to-campus-600'}`}>
          {displayAuthor?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold text-primary">{displayAuthor?.name}</span>
            {displayAuthor?.isStudentVerified && !comment.isAnonymous && (
              <Shield size={11} className="text-green-500" />
            )}
            <span className="text-xs text-tertiary ml-1">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-secondary leading-relaxed mb-2">{comment.body}</p>

          {comment.linkedPlaces?.length > 0 && (
            <div className="space-y-1 mb-2">
              {comment.linkedPlaces.map(place => (
                <Link
                  key={place._id}
                  to={`/places/${place._id}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 hover:border-primary-400 transition-colors"
                >
                  <MapPin size={11} className="text-primary-500" />
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300 flex-1 truncate">{place.name}</span>
                  {place.averageRating > 0 && (
                    <span className="text-xs text-primary-600 font-mono">★ {place.averageRating.toFixed(1)}</span>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-200
                ${isUpvoted ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-600' : 'text-tertiary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <ArrowUp size={12} className={isUpvoted ? 'fill-current' : ''} />
              {upvoteCount > 0 ? upvoteCount : 'Vote'}
            </button>

            {isPostAuthor && !comment.isAccepted && (
              <button
                onClick={() => onAccept(comment._id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-tertiary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all"
              >
                <CheckCircle size={12} /> Accept
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete(comment._id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-tertiary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-1"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ comments: initialComments, postId, postAuthorId }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState(initialComments || []);
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [linkedPlaces, setLinkedPlaces] = useState([]);
  const [placeSearch, setPlaceSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async (q) => {
    setPlaceSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await placeAPI.getAll({ search: q, college: user?.college?._id, limit: 5 });
      setSearchResults(res.data.data.places);
    } catch { setSearchResults([]); }
  };

  const addPlace = (place) => {
    if (!linkedPlaces.find(p => p._id === place._id)) setLinkedPlaces(prev => [...prev, place]);
    setPlaceSearch(''); setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await postAPI.addComment(postId, {
        body: body.trim(),
        isAnonymous,
        linkedPlaces: linkedPlaces.map(p => p._id)
      });
      setComments(prev => [...prev, res.data.data.comment]);
      setBody(''); setLinkedPlaces([]);
      toast.success('Reply added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post reply');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await postAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success('Comment removed');
    } catch { toast.error('Could not delete comment'); }
  };

  const handleAccept = async (commentId) => {
    try {
      await postAPI.acceptComment(commentId);
      setComments(prev => prev.map(c => ({
        ...c,
        isAccepted: c._id === commentId ? !c.isAccepted : false
      })));
    } catch { toast.error('Could not accept answer'); }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-base text-primary">
        {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
      </h3>

      {sortedComments.map(comment => (
        <CommentItem
          key={comment._id}
          comment={comment}
          onDelete={handleDelete}
          onAccept={handleAccept}
          postAuthorId={postAuthorId}
        />
      ))}

      {comments.length === 0 && (
        <div className="text-center py-8 text-tertiary">
          <MessageCircle className="mx-auto mb-2 opacity-40" size={28} />
          <p className="text-sm">No replies yet. Be the first to help!</p>
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-campus-400 to-campus-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <textarea
              className="flex-1 bg-transparent text-sm text-primary placeholder-tertiary focus:outline-none resize-none min-h-[60px] leading-relaxed"
              placeholder="Share a helpful reply or recommendation..."
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Link places to comment */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-default">
              <LinkIcon size={12} className="text-tertiary" />
              <input
                type="text"
                className="flex-1 bg-transparent text-xs focus:outline-none text-primary placeholder-tertiary"
                placeholder="Link a place to your reply..."
                value={placeSearch}
                onChange={e => searchPlaces(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 card py-1 z-20">
                {searchResults.map(place => (
                  <button key={place._id} type="button" onClick={() => addPlace(place)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className="text-xs text-primary truncate">{place.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {linkedPlaces.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {linkedPlaces.map(p => (
                <span key={p._id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                  <MapPin size={9} />{p.name}
                  <button type="button" onClick={() => setLinkedPlaces(prev => prev.filter(x => x._id !== p._id))}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium
                ${isAnonymous ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-600' : 'text-tertiary hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
              {isAnonymous ? 'Anonymous' : 'Public'}
            </button>
            <button type="submit" disabled={loading || !body.trim()} className="btn-campus text-xs py-1.5 px-4">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={13} /> Reply</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-4 text-center">
          <p className="text-sm text-secondary mb-3">Sign in to reply to this post</p>
          <Link to="/login" className="btn-primary text-sm py-2 px-6 inline-flex">Sign In</Link>
        </div>
      )}
    </div>
  );
}

// need this import
import { MessageCircle } from 'lucide-react';
