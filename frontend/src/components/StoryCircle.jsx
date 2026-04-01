import { useState, useRef } from 'react';
import { createStory } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StoryCircle = ({ user, stories, onClick }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);
  const { user: currentUser } = useAuth();

  const hasUnviewedStories = stories?.some(s => 
    !s.viewers?.some(v => v.user?._id === currentUser?._id)
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await createStory(file, caption);
      setShowUpload(false);
      setCaption('');
      if (window.refreshStories) window.refreshStories();
    } catch (error) {
      console.error('Error uploading story:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          minWidth: '70px'
        }}
      >
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: hasUnviewedStories ? 'linear-gradient(135deg, #ff6b6b, #4ecdc4)' : '#3a3a4a',
            padding: '2px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#1e1e2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4ecdc4&color=fff&size=70`}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {user?._id === currentUser?._id && stories?.length === 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpload(true);
                }}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: '#4ecdc4',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #1e1e2e',
                  zIndex: 5
                }}
              >
                <i className="fas fa-plus" style={{ fontSize: '12px', color: '#1e1e2e' }}></i>
              </div>
            )}
            {user?._id === currentUser?._id && stories?.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: '#1e1e2e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4ecdc4',
                  fontSize: '10px',
                  color: '#4ecdc4'
                }}
              >
                {stories.length}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: '#888', textAlign: 'center', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user?.name?.split(' ')[0] || user?.name}
        </span>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
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
            <h3 style={{ color: 'white', marginBottom: '16px' }}>Add Story</h3>
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                background: '#4ecdc4',
                border: 'none',
                borderRadius: '12px',
                color: '#1e1e2e',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              {uploading ? 'Uploading...' : 'Choose Image/Video'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => setShowUpload(false)}
              style={{
                width: '100%',
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
          </div>
        </div>
      )}
    </>
  );
};

export default StoryCircle;