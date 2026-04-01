import { useState, useEffect, useRef } from 'react';
import { viewStory, deleteStory, createStory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const StoryModal = ({ isOpen, onClose, stories, initialIndex = 0, onStoryDeleted }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [shareMedia, setShareMedia] = useState(null);
  const [sharePreview, setSharePreview] = useState(null);
  const progressInterval = useRef(null);
  const controlsTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { sendMessageToChat, openChat } = useChat();

  const currentStory = stories?.[currentIndex];
  const currentStoryData = currentStory?.stories?.[0];
  const storyOwner = currentStory?.user;
  const isOwner = storyOwner?._id === user?._id;
  
  // Remove duplicate viewers
  const uniqueViewers = [];
  const viewerIds = new Set();
  currentStoryData?.viewers?.forEach(viewer => {
    const viewerId = viewer.user?._id;
    if (viewerId && !viewerIds.has(viewerId)) {
      viewerIds.add(viewerId);
      uniqueViewers.push(viewer);
    }
  });
  const viewers = uniqueViewers;

  useEffect(() => {
    if (isOpen && !paused) {
      startProgress();
    }
    return () => clearProgress();
  }, [isOpen, paused, currentIndex]);

  useEffect(() => {
    if (isOpen && currentStory && !paused && currentStoryData && !isOwner) {
      viewStory(currentStoryData._id).catch(console.error);
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [showControls]);

  // Check for post to share to story
  useEffect(() => {
    const handleShareToStory = () => {
      if (window.postToShareToStory) {
        const post = window.postToShareToStory;
        setUploadCaption(`Shared post: ${post.content?.substring(0, 50)}...`);
        setShowUpload(true);
        // Create canvas from post content
        createShareImage(post);
        window.postToShareToStory = null;
      }
    };
    
    window.addEventListener('shareToStory', handleShareToStory);
    return () => window.removeEventListener('shareToStory', handleShareToStory);
  }, []);

  const createShareImage = async (post) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Draw background
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw gradient border
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#4ecdc4');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      
      // Draw user info
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(user?.name || 'User', 50, 120);
      
      ctx.font = '32px Arial';
      ctx.fillStyle = '#4ecdc4';
      ctx.fillText('Shared a post', 50, 200);
      
      // Draw post content
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      const lines = [];
      let line = '';
      const words = (post.content || 'Shared a post').split(' ');
      for (let w of words) {
        const testLine = line + (line ? ' ' : '') + w;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 100 && line) {
          lines.push(line);
          line = w;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      let y = 300;
      for (let l of lines) {
        ctx.fillText(l, 50, y);
        y += 60;
      }
      
      // Draw post image if exists
      if (post.image) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = post.image;
        await new Promise(resolve => { img.onload = resolve; });
        const maxWidth = canvas.width - 100;
        const maxHeight = canvas.height - y - 200;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        ctx.drawImage(img, (canvas.width - width) / 2, y + 20, width, height);
      }
      
      canvas.toBlob(async (blob) => {
        setShareMedia(blob);
        setSharePreview(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error creating share image:', error);
    }
  };

  const startProgress = () => {
    clearProgress();
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + 1;
      });
    }, 50);
  };

  const clearProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      setShowViewers(false);
      setShowReplyInput(false);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      setShowViewers(false);
      setShowReplyInput(false);
    }
  };

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      startProgress();
    } else {
      setPaused(true);
      clearProgress();
    }
  };

  const handleScreenClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width * 0.2) {
      prevStory();
    } else if (x > width * 0.8) {
      nextStory();
    } else {
      setShowControls(!showControls);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !storyOwner) return;
    
    setSendingReply(true);
    try {
      await openChat(storyOwner._id);
      const replyMessage = `📸 **Story Reply**\n\n"${replyText}"\n\n🔗 Replying to ${storyOwner.name}'s story: ${currentStoryData?.caption || 'Story'}`;
      await sendMessageToChat(null, replyMessage, storyOwner._id);
      
      const storyRefs = JSON.parse(localStorage.getItem('story_replies') || '{}');
      storyRefs[Date.now()] = {
        storyId: currentStoryData._id,
        storyMedia: currentStoryData.media,
        storyCaption: currentStoryData.caption,
        storyOwner: storyOwner,
        reply: replyText
      };
      localStorage.setItem('story_replies', JSON.stringify(storyRefs));
      
      setReplyText('');
      setShowReplyInput(false);
      alert('Reply sent! Check your chat.');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!window.confirm('Delete this story?')) return;
    
    setDeleting(true);
    try {
      await deleteStory(currentStoryData._id);
      alert('Story deleted successfully');
      if (onStoryDeleted) onStoryDeleted();
      nextStory();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    } finally {
      setDeleting(false);
    }
  };

  const handleShareToStoryUpload = async () => {
    if (!shareMedia) return;
    
    setUploading(true);
    try {
      await createStory(shareMedia, uploadCaption);
      setShowUpload(false);
      setShareMedia(null);
      setSharePreview(null);
      setUploadCaption('');
      if (window.refreshStories) window.refreshStories();
      alert('Story created from shared post!');
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  const handleTouchStart = () => {
    setPaused(true);
    clearProgress();
    setShowControls(true);
  };

  const handleTouchEnd = () => {
    setPaused(false);
    startProgress();
  };

  if (!isOpen || !currentStory) return null;

  return (
    <>
      {/* Upload Modal for Share to Story */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowUpload(false);
        }}
        >
          <div style={{
            background: '#1e1e2e',
            borderRadius: '24px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>Share to Story</h3>
            {sharePreview && (
              <img 
                src={sharePreview} 
                alt="preview" 
                style={{ 
                  width: '100%', 
                  borderRadius: '12px', 
                  marginBottom: '16px',
                  maxHeight: '300px',
                  objectFit: 'cover'
                }} 
              />
            )}
            <input
              type="text"
              placeholder="Add a caption..."
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2d2d3a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowUpload(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleShareToStoryUpload}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#4ecdc4',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1e1e2e',
                  fontWeight: 'bold',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1
                }}
              >
                {uploading ? 'Creating...' : 'Share to Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleScreenClick}
      >
        {/* Progress Bars */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          gap: '4px',
          zIndex: 10
        }}>
          {currentStory.stories.map((_, idx) => (
            <div key={idx} style={{
              flex: 1,
              height: '3px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: idx === 0 ? `${progress}%` : idx < 0 ? '100%' : '0%',
                height: '100%',
                background: '#fff',
                transition: 'width 0.05s linear'
              }} />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Delete Story Button */}
        {isOwner && showControls && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteStory();
            }}
            disabled={deleting}
            style={{
              position: 'absolute',
              top: '80px',
              right: '20px',
              background: 'rgba(255,107,107,0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-trash"></i>
          </button>
        )}

        {/* Viewers Button */}
        {isOwner && showControls && viewers.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowViewers(!showViewers);
            }}
            style={{
              position: 'absolute',
              top: '140px',
              right: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#4ecdc4',
              fontSize: '16px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-eye"></i>
            <span style={{ fontSize: '10px', marginLeft: '2px' }}>{viewers.length}</span>
          </button>
        )}

        {/* Pause/Resume Button */}
        {showControls && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            style={{
              position: 'absolute',
              bottom: '100px',
              right: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
          >
            <i className={paused ? 'fas fa-play' : 'fas fa-pause'}></i>
          </button>
        )}

        {/* Reply Button */}
        {!isOwner && showControls && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(!showReplyInput);
            }}
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              color: '#4ecdc4',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
          >
            <i className="fas fa-reply"></i>
          </button>
        )}

        {/* Reply Input Modal */}
        {showReplyInput && (
          <div
            style={{
              position: 'absolute',
              bottom: '170px',
              left: '20px',
              right: '20px',
              background: '#1e1e2e',
              borderRadius: '20px',
              padding: '16px',
              zIndex: 20,
              border: '1px solid #4ecdc4',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <img
                src={storyOwner?.avatar || `https://ui-avatars.com/api/?name=${storyOwner?.name}&background=4ecdc4&color=fff`}
                alt="avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
              <span style={{ color: '#4ecdc4', fontSize: '12px' }}>Reply to {storyOwner?.name}'s story</span>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#2d2d3a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                resize: 'none',
                fontSize: '14px',
                marginBottom: '12px'
              }}
              rows="3"
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowReplyInput(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={sendingReply || !replyText.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#4ecdc4',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1e1e2e',
                  fontWeight: 'bold',
                  cursor: sendingReply || !replyText.trim() ? 'not-allowed' : 'pointer',
                  opacity: sendingReply || !replyText.trim() ? 0.5 : 1
                }}
              >
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}

        {/* Viewers Modal */}
        {showViewers && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#1e1e2e',
              borderRadius: '20px',
              padding: '20px',
              width: '300px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 20,
              border: '1px solid #4ecdc4',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Views ({viewers.length})</h3>
              <button
                onClick={() => setShowViewers(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            {viewers.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>No views yet</p>
            ) : (
              viewers.map((viewer, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <img
                    src={viewer.user?.avatar || `https://ui-avatars.com/api/?name=${viewer.user?.name}&background=4ecdc4&color=fff`}
                    alt="avatar"
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ color: 'white', fontWeight: '500' }}>{viewer.user?.name}</div>
                    <div style={{ color: '#888', fontSize: '11px' }}>{new Date(viewer.viewedAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Story Content */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {currentStoryData?.mediaType === 'video' ? (
            <video
              src={currentStoryData.media}
              autoPlay
              muted={!paused}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <img
              src={currentStoryData?.media}
              alt="story"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>

        {/* User Info */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0,0,0,0.5)',
          padding: '10px 16px',
          borderRadius: '50px',
          backdropFilter: 'blur(10px)'
        }}>
          <img
            src={currentStory.user?.avatar || `https://ui-avatars.com/api/?name=${currentStory.user?.name}&background=4ecdc4&color=fff`}
            alt="avatar"
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
          />
          <div>
            <h4 style={{ color: 'white', margin: 0, fontSize: '14px' }}>{currentStory.user?.name}</h4>
            {currentStoryData?.caption && (
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '12px' }}>
                {currentStoryData.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StoryModal;