import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { likeReel, addReelComment, shareReel, deleteReel, deleteReelComment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReelPlayer = ({ reel, onDelete, isActive = true }) => {
  const [isLiked, setIsLiked] = useState(reel.likes?.includes(reel.currentUser?._id));
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [comments, setComments] = useState(reel.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const { user } = useAuth();

  const isOwner = reel.user?._id === user?._id;

  // Play/pause based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isPlaying) {
        videoRef.current.play();
        startProgress();
      } else if (!isActive) {
        videoRef.current.pause();
        clearProgress();
      } else if (isActive && !isPlaying) {
        videoRef.current.pause();
        clearProgress();
      }
    }
    return () => clearProgress();
  }, [isActive, isPlaying]);

  const startProgress = () => {
    clearProgress();
    progressInterval.current = setInterval(() => {
      if (videoRef.current) {
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(currentProgress);
      }
    }, 100);
  };

  const clearProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = percentage * videoRef.current.duration;
      setProgress(percentage * 100);
    }
  };

  const handleLike = async () => {
    try {
      await likeReel(reel._id);
      if (isLiked) {
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await addReelComment(reel._id, commentText);
      setComments(data);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        const { data } = await deleteReelComment(reel._id, commentId);
        setComments(data.comments);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleDeleteReel = async () => {
    if (window.confirm('Delete this reel?')) {
      try {
        await deleteReel(reel._id);
        if (onDelete) onDelete(reel._id);
      } catch (error) {
        console.error('Error deleting reel:', error);
      }
    }
    setShowDeleteMenu(false);
  };

  const handleShare = async () => {
    try {
      await shareReel(reel._id);
      alert('Reel shared!');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing reel:', error);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reel._id}`);
    alert('Link copied!');
    setShowShareMenu(false);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px',
      height: 'calc(100vh - 120px)',
      maxHeight: '600px',
      background: '#000',
      borderRadius: '20px',
      overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video}
        loop
        muted={volume === 0}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onClick={() => setIsPlaying(!isPlaying)}
      />

      {/* Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '3px',
        background: 'rgba(255,255,255,0.3)',
        cursor: 'pointer'
      }} onClick={handleSeek}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#4ecdc4',
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* User Info */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10
      }}>
        <Link to={`/profile/${reel.user?._id}`}>
          <img
            src={reel.user?.avatar || `https://ui-avatars.com/api/?name=${reel.user?.name}&background=4ecdc4&color=fff&size=40`}
            alt="avatar"
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #4ecdc4' }}
          />
        </Link>
        <Link to={`/profile/${reel.user?._id}`} style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>
          {reel.user?.name}
        </Link>
        {isOwner && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {showDeleteMenu && (
              <div style={{
                position: 'absolute',
                top: '30px',
                right: '0',
                background: '#2d2d3a',
                borderRadius: '8px',
                padding: '8px',
                zIndex: 20
              }}>
                <button
                  onClick={handleDeleteReel}
                  style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '8px 16px' }}
                >
                  Delete Reel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {reel.caption && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '16px',
          right: '80px',
          color: 'white',
          fontSize: '14px',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          zIndex: 10,
          background: 'rgba(0,0,0,0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          {reel.caption}
        </div>
      )}

      {/* Music */}
      {reel.music && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '16px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 10px',
          borderRadius: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <i className="fas fa-music"></i>
          <span>{reel.music}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 10
      }}>
        {/* Like */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleLike}
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: isLiked ? '#ff6b6b' : 'white',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
          </button>
          <div style={{ color: 'white', fontSize: '12px', marginTop: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatNumber(likesCount)}</div>
        </div>

        {/* Comment */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="far fa-comment"></i>
          </button>
          <div style={{ color: 'white', fontSize: '12px', marginTop: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatNumber(comments.length)}</div>
        </div>

        {/* Share */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-share-alt"></i>
          </button>
          <div style={{ color: 'white', fontSize: '12px', marginTop: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatNumber(reel.shares || 0)}</div>
          
          {showShareMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              background: '#2d2d3a',
              borderRadius: '12px',
              padding: '8px',
              marginBottom: '8px',
              minWidth: '140px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={handleShare}
                style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}
              >
                <i className="fas fa-share-alt"></i> Share
              </button>
              <button
                onClick={copyLink}
                style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}
              >
                <i className="fas fa-link"></i> Copy Link
              </button>
            </div>
          )}
        </div>

        {/* Volume */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className={volume === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up'}></i>
          </button>
          {showVolume && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{
                position: 'absolute',
                bottom: '100%',
                right: '0',
                width: '100px',
                transform: 'rotate(-90deg) translateX(-50%)',
                transformOrigin: '100% 100%',
                marginBottom: '40px'
              }}
            />
          )}
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(30,30,46,0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '20px 20px 0 0',
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: 'white', margin: 0 }}>Comments</h4>
            <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
          </div>
          
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: '10px',
                background: '#3a3a4a',
                border: 'none',
                borderRadius: '20px',
                color: 'white'
              }}
            />
            <button type="submit" style={{ background: '#4ecdc4', border: 'none', padding: '8px 16px', borderRadius: '20px', color: '#1e1e2e', cursor: 'pointer' }}>Post</button>
          </form>

          {comments.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>No comments yet</p>
          ) : (
            comments.map(comment => (
              <div key={comment._id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <img
                  src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name}&background=4ecdc4&color=fff&size=32`}
                  alt="avatar"
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4ecdc4', fontWeight: 'bold', fontSize: '13px' }}>{comment.user?.name}</span>
                    {comment.user?._id === user?._id && (
                      <button onClick={() => handleDeleteComment(comment._id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                  <p style={{ color: 'white', fontSize: '13px', marginTop: '4px' }}>{comment.text}</p>
                  <span style={{ fontSize: '10px', color: '#888' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReelPlayer;