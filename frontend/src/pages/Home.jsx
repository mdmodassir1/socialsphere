import { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, likePost, addComment, getStories } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import ChatModal from '../components/ChatModal';
import StoryCircle from '../components/StoryCircle';
import StoryModal from '../components/StoryModal';
import ShareToChatModal from '../components/ShareToChatModal';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [openChatWith, setOpenChatWith] = useState(null);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    
    if (window.openChatWithUser) {
      setOpenChatWith(window.openChatWithUser);
      window.openChatWithUser = null;
    }
    
    window.refreshStories = fetchStories;
    
    const handleOpenStory = (event) => {
      if (event.detail) {
        const storyData = {
          user: event.detail.storyOwner,
          stories: [{
            _id: event.detail.storyId,
            media: event.detail.storyMedia,
            caption: event.detail.storyCaption,
            mediaType: event.detail.storyMedia?.includes('video') ? 'video' : 'image'
          }]
        };
        setSelectedStory(storyData);
        setStoryModalOpen(true);
      }
    };
    
    const handleShareToChat = (event) => {
      if (event.detail?.post) {
        setPostToShare(event.detail.post);
        setShareModalOpen(true);
      }
    };
    
    window.addEventListener('openStory', handleOpenStory);
    window.addEventListener('shareToChat', handleShareToChat);
    
    return () => {
      window.refreshStories = null;
      window.removeEventListener('openStory', handleOpenStory);
      window.removeEventListener('shareToChat', handleShareToChat);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const { data } = await getStories();
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setPosting(true);
    try {
      const { data } = await createPost(content, imageFile);
      setPosts([data, ...posts]);
      setContent('');
      removeImage();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: post.likes.includes(user._id) 
                ? post.likes.filter(id => id !== user._id) 
                : [...post.likes, user._id] 
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const { data } = await addComment(postId, text);
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, comments: data }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  const userStories = stories.find(s => s.user?._id === user?._id);
  const otherStories = stories.filter(s => s.user?._id !== user?._id);

  return (
    <>
      <div className="app-container">
        <div className="home-container">
          
          {/* STORIES SECTION */}
          <div style={{
            background: '#1e1e2e',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '16px',
              paddingBottom: '8px'
            }}>
              {/* Your Story */}
              <StoryCircle
                user={user}
                stories={userStories?.stories || []}
                onClick={() => {
                  if (userStories?.stories?.length) {
                    setSelectedStory(userStories);
                    setStoryModalOpen(true);
                  }
                }}
              />
              
              {/* Other Users' Stories */}
              {otherStories.map(story => (
                <StoryCircle
                  key={story.user._id}
                  user={story.user}
                  stories={story.stories}
                  onClick={() => {
                    setSelectedStory(story);
                    setStoryModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Create Post Card */}
          <div className="create-post">
            <div className="create-post-header">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4ecdc4&color=fff`}
                alt="avatar"
                className="create-post-avatar"
              />
              <div>
                <h4>{user?.name}</h4>
                <p>Share what's on your mind</p>
              </div>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${user?.name}?`}
                rows="3"
              />
              
              {imagePreview && (
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px', 
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }} 
                  />
                  <button
                    type="button"
                    onClick={removeImage}
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
              
              <div className="create-post-actions">
                <div className="post-buttons-group">
                  <button 
                    type="button" 
                    className="post-icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-image"></i>
                    <span>Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                  <button type="button" className="post-icon-btn">
                    <i className="fas fa-smile"></i>
                    <span>Emoji</span>
                  </button>
                </div>
                <button type="submit" disabled={posting} className="submit-post">
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-newspaper"></i>
              <h3>No posts yet</h3>
              <p>Be the first to share something!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                currentUser={user}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {openChatWith && (
        <ChatModal
          isOpen={!!openChatWith}
          onClose={() => setOpenChatWith(null)}
          user={openChatWith}
        />
      )}

      {/* Story Modal */}
      {selectedStory && (
        <StoryModal
          isOpen={storyModalOpen}
          onClose={() => {
            setStoryModalOpen(false);
            setSelectedStory(null);
            fetchStories();
          }}
          onStoryDeleted={() => {
            fetchStories();
          }}
          stories={[selectedStory]}
          initialIndex={0}
        />
      )}

      {/* Share to Chat Modal */}
      <ShareToChatModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setPostToShare(null);
        }}
        post={postToShare}
      />
    </>
  );
};

export default Home;