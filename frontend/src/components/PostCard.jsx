import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { deletePost, deleteComment, sharePost, editPost, trackPostView } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const PostCard = ({ post, onLike, onComment, currentUser }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const shareMenuRef = useRef(null);
  const postRef = useRef(null);
  const actionsTimeoutRef = useRef(null);
  const { openChat } = useChat();

  const isLiked = post.likes?.includes(currentUser?._id);
  const isOwner = post.user?._id === currentUser?._id;
  const isShared = post.sharedFrom;
  const originalPost = post.originalPost || post.sharedFrom;
  const displayUser = isShared ? post.originalPost?.user || post.sharedFrom?.user : post.user;
  const displayContent = isShared ? post.originalPost?.content || post.sharedFrom?.content : post.content;
  const displayImage = isShared ? post.originalPost?.image || post.sharedFrom?.image : post.image;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackPostView(post._id).catch(console.error);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => observer.disconnect();
  }, [post._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeletePost = async () => {
    if (window.confirm('Delete this post?')) {
      setDeleting(true);
      try {
        await deletePost(post._id);
        window.location.reload();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete post');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleEditPost = async () => {
    if (!editContent.trim()) return;
    setEditing(true);
    try {
      await editPost(post._id, editContent);
      window.location.reload();
    } catch (error) {
      console.error('Error editing post:', error);
      alert('Failed to edit post');
    } finally {
      setEditing(false);
      setIsEditing(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      setDeletingComment(commentId);
      try {
        await deleteComment(post._id, commentId);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
      } finally {
        setDeletingComment(null);
      }
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await sharePost(post._id, shareCaption);
      alert('Post shared successfully!');
      setShowShareMenu(false);
      setShareCaption('');
      window.location.reload();
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const handleShareToChat = async () => {
    setSharing(true);
    try {
      window.selectedPostToShare = post;
      window.dispatchEvent(new CustomEvent('shareToChat', { detail: { post } }));
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing to chat:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleShareToStory = async () => {
    window.postToShareToStory = post;
    window.dispatchEvent(new CustomEvent('shareToStory', { detail: { post } }));
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      <div ref={postRef} style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Link to={`/profile/${displayUser?._id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={displayUser?.avatar || `https://ui-avatars.com/api/?name=${displayUser?.name || 'User'}&background=4ecdc4&color=fff&bold=true`}
                alt={displayUser?.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4ecdc4' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                background: '#4ecdc4',
                borderRadius: '50%',
                border: '2px solid #1e1e2e'
              }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{displayUser?.name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                {post.edited && (
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>(edited)</span>
                )}
              </div>
            </div>
          </Link>
          
          {isOwner && (
            <div style={{ display: 'flex', gap: '8px', opacity: showActions ? 1 : 0.5, transition: 'opacity 0.2s' }}>
              <button 
                onClick={() => setIsEditing(true)} 
                style={{ 
                  background: 'rgba(78,205,196,0.1)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: '#4ecdc4',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(78,205,196,0.2)'; e.target.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(78,205,196,0.1)'; e.target.style.transform = 'scale(1)'; }}
              >
                <i className="fas fa-edit"></i>
              </button>
              <button 
                onClick={handleDeletePost} 
                disabled={deleting} 
                style={{ 
                  background: 'rgba(255,107,107,0.1)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,107,107,0.2)'; e.target.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,107,107,0.1)'; e.target.style.transform = 'scale(1)'; }}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          )}
        </div>

        {/* Shared Indicator */}
        {isShared && (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(78,205,196,0.08)',
            fontSize: '12px',
            color: '#4ecdc4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-share-alt"></i>
            <span>Shared from {post.sharedFrom?.user?.name || 'a user'}</span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#e4e4e4', marginBottom: displayImage ? '16px' : 0 }}>{displayContent || post.content}</p>
          {displayImage && (
            <img 
              src={displayImage} 
              alt="post" 
              style={{ 
                marginTop: '12px', 
                borderRadius: '16px', 
                maxWidth: '100%', 
                maxHeight: '450px', 
                objectFit: 'cover',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => window.open(displayImage, '_blank')}
            />
          )}
        </div>

        {/* Stats */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '24px',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fas fa-heart" style={{ color: '#ff6b6b' }}></i>
            {formatNumber(post.likes?.length || 0)} likes
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fas fa-comment"></i>
            {formatNumber(post.comments?.length || 0)} comments
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fas fa-share-alt"></i>
            {formatNumber(post.shares || 0)} shares
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: '12px' }}>
          <button onClick={() => onLike(post._id)} style={{
            flex: 1,
            background: isLiked ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.03)',
            border: 'none',
            padding: '10px',
            borderRadius: '40px',
            color: isLiked ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (!isLiked) e.target.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { if (!isLiked) e.target.style.background = 'rgba(255,255,255,0.03)'; }}>
            <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </button>
          
          <button onClick={() => setShowComments(!showComments)} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: 'none',
            padding: '10px',
            borderRadius: '40px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; }}>
            <i className="far fa-comment"></i>
            <span>Comment</span>
          </button>
          
          <div style={{ position: 'relative', flex: 1 }} ref={shareMenuRef}>
            <button onClick={() => setShowShareMenu(!showShareMenu)} style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: 'none',
              padding: '10px',
              borderRadius: '40px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; }}>
              <i className="fas fa-share-alt"></i>
              <span>Share</span>
            </button>
            
            {showShareMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#2d2d3a',
                borderRadius: '16px',
                padding: '12px',
                marginBottom: '8px',
                zIndex: 100,
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={shareCaption}
                    onChange={(e) => setShareCaption(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#3a3a4a',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
                <button onClick={handleShare} disabled={sharing} style={{
                  width: '100%',
                  padding: '8px',
                  background: '#4ecdc4',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#1e1e2e',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-newspaper"></i> Share to Feed
                </button>
                <button onClick={handleShareToChat} disabled={sharing} style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(78,205,196,0.15)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#4ecdc4',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-comment"></i> Share to Chat
                </button>
                <button onClick={handleShareToStory} disabled={sharing} style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(78,205,196,0.15)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#4ecdc4',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-play-circle"></i> Share to Story
                </button>
                <button onClick={copyLink} style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-link"></i> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ padding: '16px 20px', background: 'rgba(0, 0, 0, 0.3)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <form onSubmit={(e) => { e.preventDefault(); onComment(post._id, commentText); setCommentText(''); }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=4ecdc4&color=fff&size=32`}
                alt="avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '40px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                border: 'none',
                padding: '0 20px',
                borderRadius: '40px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>

            {post.comments?.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>No comments yet. Be the first!</p>
            ) : (
              post.comments?.map((comment, index) => {
                const isCommentOwner = comment.user?._id === currentUser?._id;
                return (
                  <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <img
                      src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name || 'User'}&background=4ecdc4&color=fff&size=32`}
                      alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Link to={`/profile/${comment.user?._id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#4ecdc4' }}>{comment.user?.name}</span>
                        </Link>
                        {isCommentOwner && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            disabled={deletingComment === comment._id}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4' }}>{comment.text}</p>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#1e1e2e',
            borderRadius: '24px',
            padding: '28px',
            width: '500px',
            maxWidth: '90%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '22px' }}>
              <i className="fas fa-edit" style={{ marginRight: '10px', color: '#4ecdc4' }}></i>
              Edit Post
            </h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#2d2d3a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                fontSize: '14px',
                resize: 'none',
                marginBottom: '20px',
                fontFamily: 'inherit'
              }}
              rows="5"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '40px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditPost}
                disabled={editing}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                  border: 'none',
                  borderRadius: '40px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: editing ? 'not-allowed' : 'pointer',
                  opacity: editing ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;