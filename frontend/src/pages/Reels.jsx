import { useState, useEffect, useRef, useCallback } from 'react';
import { getReels, getTrendingReels, createReel } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReelPlayer from '../components/ReelPlayer';

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [trendingReels, setTrendingReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forYou');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadMusic, setUploadMusic] = useState('');
  const [uploadVideo, setUploadVideo] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const reelsContainerRef = useRef(null);
  const observerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'forYou') {
      fetchReels();
    } else {
      fetchTrendingReels();
    }
  }, [page, activeTab]);

  useEffect(() => {
    // Reset current index when tab changes
    setCurrentIndex(0);
  }, [activeTab]);

  useEffect(() => {
    // Setup scroll observer for infinite loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && activeTab === 'forYou') {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, activeTab]);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const { data } = await getReels(page);
      if (page === 1) {
        setReels(data.reels);
      } else {
        setReels(prev => [...prev, ...data.reels]);
      }
      setHasMore(data.reels.length === 10);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingReels = async () => {
    setLoading(true);
    try {
      const { data } = await getTrendingReels();
      setTrendingReels(data.reels || []);
    } catch (error) {
      console.error('Error fetching trending reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadVideo) return;
    
    setUploading(true);
    try {
      await createReel(uploadVideo, uploadCaption, uploadMusic);
      setShowUpload(false);
      setUploadCaption('');
      setUploadMusic('');
      setUploadVideo(null);
      setUploadPreview('');
      if (activeTab === 'forYou') {
        setPage(1);
        fetchReels();
      } else {
        fetchTrendingReels();
      }
      alert('Reel uploaded successfully!');
    } catch (error) {
      console.error('Error uploading reel:', error);
      alert('Failed to upload reel. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReel = (reelId) => {
    setReels(prev => prev.filter(r => r._id !== reelId));
    setTrendingReels(prev => prev.filter(r => r._id !== reelId));
  };

  const handleScroll = useCallback(() => {
    if (!reelsContainerRef.current) return;
    
    const container = reelsContainerRef.current;
    const scrollTop = container.scrollTop;
    const reelHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / reelHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < (activeTab === 'forYou' ? reels.length : trendingReels.length)) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, activeTab, reels.length, trendingReels.length]);

  useEffect(() => {
    const container = reelsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index) => {
    if (reelsContainerRef.current) {
      const container = reelsContainerRef.current;
      const reelHeight = container.clientHeight;
      container.scrollTo({
        top: index * reelHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const displayReels = activeTab === 'forYou' ? reels : trendingReels;

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#000',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>
          <i className="fas fa-film" style={{ color: '#4ecdc4', marginRight: '8px' }}></i>
          Reels
        </h1>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '40px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-plus"></i> Create
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '0 20px'
      }}>
        <button
          onClick={() => { setActiveTab('forYou'); setPage(1); setCurrentIndex(0); }}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            color: activeTab === 'forYou' ? '#4ecdc4' : '#888',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'forYou' ? 'bold' : 'normal',
            borderBottom: activeTab === 'forYou' ? '2px solid #4ecdc4' : 'none'
          }}
        >
          For You
        </button>
        <button
          onClick={() => { setActiveTab('trending'); setPage(1); setCurrentIndex(0); }}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            color: activeTab === 'trending' ? '#4ecdc4' : '#888',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'trending' ? 'bold' : 'normal',
            borderBottom: activeTab === 'trending' ? '2px solid #4ecdc4' : 'none'
          }}
        >
          <i className="fas fa-fire"></i> Trending
        </button>
      </div>

      {/* Reels Container - Scrollable */}
      <div
        ref={reelsContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          height: 'calc(100vh - 120px)'
        }}
      >
        {loading && displayReels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '40px' }}></i>
            <p style={{ marginTop: '16px' }}>Loading reels...</p>
          </div>
        ) : displayReels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>
            <i className="fas fa-film" style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.5 }}></i>
            <p>No reels yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              {activeTab === 'trending' ? 'No trending reels available' : 'Be the first to create a reel!'}
            </p>
          </div>
        ) : (
          <>
            {displayReels.map((reel, index) => (
              <div
                key={reel._id}
                style={{
                  scrollSnapAlign: 'start',
                  height: 'calc(100vh - 120px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#000'
                }}
              >
                <ReelPlayer
                  reel={{ ...reel, currentUser: user }}
                  onDelete={handleDeleteReel}
                  isActive={index === currentIndex}
                />
              </div>
            ))}
            
            {/* Load More Observer */}
            {activeTab === 'forYou' && hasMore && (
              <div ref={observerRef} style={{ height: '20px' }} />
            )}
            
            {activeTab === 'forYou' && !hasMore && displayReels.length > 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No more reels to load</p>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div style={{
            background: '#1e1e2e',
            borderRadius: '24px',
            padding: '24px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Create Reel</h3>
            
            {uploadPreview ? (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <video
                  src={uploadPreview}
                  controls
                  style={{ width: '100%', borderRadius: '12px', maxHeight: '400px' }}
                />
                <button
                  onClick={() => { setUploadVideo(null); setUploadPreview(''); }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: '#2d2d3a',
                borderRadius: '16px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}>
                <i className="fas fa-video" style={{ fontSize: '48px', color: '#4ecdc4', marginBottom: '12px' }}></i>
                <span style={{ color: 'white' }}>Click to select video (15-60 seconds)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: 'none' }}
                />
              </label>
            )}

            <input
              type="text"
              placeholder="Caption"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2d2d3a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                marginBottom: '12px'
              }}
            />

            <input
              type="text"
              placeholder="Music (optional)"
              value={uploadMusic}
              onChange={(e) => setUploadMusic(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2d2d3a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                marginBottom: '20px'
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
                onClick={handleUpload}
                disabled={!uploadVideo || uploading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Reel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;