import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, followUser, getPosts, getStories, trackProfileView, updateProfile, getUserReels } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import PostCard from '../components/PostCard';
import ChatModal from '../components/ChatModal';
import EditProfileModal from '../components/EditProfileModal';
import StoryCircle from '../components/StoryCircle';
import StoryModal from '../components/StoryModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ReelPlayer from '../components/ReelPlayer';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [showChat, setShowChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const { user, setUser } = useAuth();
  const { openChat } = useChat();

  const isOwnProfile = user?._id === id;
  const isFollowing = profile?.followers?.some(f => f._id === user?._id);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
    fetchUserReels();
    fetchStories();
    
    if (id && user && user._id !== id) {
      trackProfileView(id).catch(console.error);
    }
  }, [id, user]);

  const fetchProfile = async () => {
    try {
      const { data } = await getUserProfile(id);
      setProfile(data);
      setFollowersCount(data.followers?.length || 0);
      setFollowingCount(data.following?.length || 0);
      setFollowing(data.followers?.some(f => f._id === user?._id));
      setCoverPhotoPreview(data.coverPhoto || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data } = await getPosts();
      setPosts(data.filter(post => post.user?._id === id));
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchUserReels = async () => {
    try {
      const { data } = await getUserReels(id);
      setReels(data);
    } catch (error) {
      console.error('Error fetching reels:', error);
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

  const handleFollow = async () => {
    try {
      const { data } = await followUser(id);
      if (data.following) {
        setFollowersCount(prev => prev + 1);
        setFollowing(true);
      } else {
        setFollowersCount(prev => prev - 1);
        setFollowing(false);
      }
      fetchProfile();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleMessage = () => {
    openChat(id);
    setShowChat(true);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    if (isOwnProfile) {
      setUser(updatedProfile);
    }
  };

  const handleCoverPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoUpload = async () => {
    if (!coverPhotoFile) return;
    
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('coverPhoto', coverPhotoFile);
    if (profile?.bio) formData.append('bio', profile.bio);
    if (profile?.name) formData.append('name', profile.name);
    
    try {
      const { data } = await updateProfile(formData);
      setProfile(data);
      setCoverPhotoPreview(data.coverPhoto);
      setCoverPhotoFile(null);
      if (isOwnProfile) setUser(data);
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      alert('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteReel = (reelId) => {
    setReels(prev => prev.filter(r => r._id !== reelId));
  };

  const userStories = stories?.find(s => s.user?._id === id);
  const hasStories = userStories?.stories?.length > 0;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <i className="fas fa-user-slash"></i>
        <h3>User not found</h3>
        <p>The user you're looking for doesn't exist</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
          
          {/* Profile Header Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
            
            {/* Cover Image with Upload */}
            <div style={{
              height: '220px',
              background: coverPhotoPreview ? `url(${coverPhotoPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {isOwnProfile && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <label style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 16px',
                    borderRadius: '40px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-camera"></i>
                    <span>Change Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {coverPhotoFile && coverPhotoPreview !== profile?.coverPhoto && (
                    <button
                      onClick={handleCoverPhotoUpload}
                      disabled={uploadingCover}
                      style={{
                        background: '#4ecdc4',
                        border: 'none',
                        padding: '8px 20px',
                        borderRadius: '40px',
                        color: '#1e1e2e',
                        fontWeight: 'bold',
                        cursor: uploadingCover ? 'not-allowed' : 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {uploadingCover ? 'Saving...' : 'Save Cover'}
                    </button>
                  )}
                </div>
              )}
              
              {/* Avatar */}
              <div style={{
                position: 'absolute',
                bottom: '-60px',
                left: '40px'
              }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                  <img
                    src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=4ecdc4&color=fff&size=140&bold=true`}
                    alt={profile.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div style={{ padding: '80px 40px 40px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <h1 style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: 'white',
                      margin: 0,
                      background: 'linear-gradient(135deg, #fff, #4ecdc4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>{profile.name}</h1>
                    
                    {isOwnProfile && (
                      <>
                        <button
                          onClick={() => setShowEditModal(true)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '8px 20px',
                            borderRadius: '40px',
                            color: 'white',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fas fa-edit"></i>
                          <span>Edit Profile</span>
                        </button>
                        
                        <button
                          onClick={() => setShowAnalytics(true)}
                          style={{
                            background: 'rgba(78,205,196,0.15)',
                            border: '1px solid rgba(78,205,196,0.3)',
                            padding: '8px 20px',
                            borderRadius: '40px',
                            color: '#4ecdc4',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fas fa-chart-line"></i>
                          <span>Analytics</span>
                        </button>
                      </>
                    )}
                  </div>
                  
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <i className="fas fa-calendar-alt" style={{ fontSize: '12px' }}></i>
                    Joined {formatDate(profile.createdAt)}
                  </p>
                  
                  {profile.bio && (
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      maxWidth: '500px',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px 16px',
                      borderRadius: '20px',
                      marginTop: '8px'
                    }}>{profile.bio}</p>
                  )}
                </div>
                
                {!isOwnProfile && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleFollow}
                      style={{
                        background: isFollowing 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                        border: isFollowing ? '1px solid rgba(255,255,255,0.2)' : 'none',
                        padding: '12px 28px',
                        borderRadius: '40px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={isFollowing ? 'fas fa-user-minus' : 'fas fa-user-plus'}></i>
                      <span style={{ marginLeft: '8px' }}>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                    </button>
                    
                    <button
                      onClick={handleMessage}
                      style={{
                        background: 'rgba(78, 205, 196, 0.15)',
                        border: '1px solid rgba(78, 205, 196, 0.3)',
                        padding: '12px 28px',
                        borderRadius: '40px',
                        color: '#4ecdc4',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-envelope"></i>
                      <span>Message</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '48px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{posts.length}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Posts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{followersCount}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Followers</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{followingCount}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Following</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{reels.length}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Reels</div>
                </div>
              </div>

              {/* Stories Section */}
              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                    <i className="fas fa-play-circle" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                    Stories
                  </h3>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  paddingBottom: '8px'
                }}>
                  <StoryCircle
                    user={profile}
                    stories={userStories?.stories || []}
                    onClick={() => {
                      if (hasStories) {
                        setSelectedStory(userStories);
                        setStoryModalOpen(true);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => setActiveTab('posts')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: activeTab === 'posts' ? '#4ecdc4' : 'rgba(255, 255, 255, 0.6)',
                borderBottom: activeTab === 'posts' ? '2px solid #4ecdc4' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-th-large"></i>
              <span>Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: activeTab === 'reels' ? '#4ecdc4' : 'rgba(255, 255, 255, 0.6)',
                borderBottom: activeTab === 'reels' ? '2px solid #4ecdc4' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-film"></i>
              <span>Reels</span>
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: activeTab === 'followers' ? '#4ecdc4' : 'rgba(255, 255, 255, 0.6)',
                borderBottom: activeTab === 'followers' ? '2px solid #4ecdc4' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-users"></i>
              <span>Followers</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: activeTab === 'following' ? '#4ecdc4' : 'rgba(255, 255, 255, 0.6)',
                borderBottom: activeTab === 'following' ? '2px solid #4ecdc4' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-user-friends"></i>
              <span>Following</span>
            </button>
          </div>
          
          {/* Tab Content - Posts */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-camera"></i>
                  <h3>No posts yet</h3>
                  <p>{isOwnProfile ? 'Share your first post!' : 'This user hasn\'t posted anything yet'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {posts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onLike={() => {}}
                      onComment={() => {}}
                      currentUser={user}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tab Content - Reels */}
          {activeTab === 'reels' && (
            <div>
              {reels.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-film"></i>
                  <h3>No reels yet</h3>
                  <p>{isOwnProfile ? 'Create your first reel!' : 'This user hasn\'t created any reels yet'}</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px',
                  justifyItems: 'center'
                }}>
                  {reels.map(reel => (
                    <ReelPlayer key={reel._id} reel={{ ...reel, currentUser: user }} onDelete={handleDeleteReel} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tab Content - Followers */}
          {activeTab === 'followers' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '24px'
            }}>
              {profile.followers?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <i className="fas fa-user-plus" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}></i>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No followers yet</p>
                  {isOwnProfile && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                      Share your profile to get more followers!
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {profile.followers.map(follower => (
                    <Link
                      key={follower._id}
                      to={`/profile/${follower._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '20px',
                        textDecoration: 'none'
                      }}
                    >
                      <img
                        src={follower.avatar || `https://ui-avatars.com/api/?name=${follower.name}&background=4ecdc4&color=fff&size=48`}
                        alt={follower.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(78,205,196,0.3)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '4px', fontSize: '15px' }}>{follower.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                          @{follower.name.toLowerCase().replace(/\s/g, '')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tab Content - Following */}
          {activeTab === 'following' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '24px'
            }}>
              {profile.following?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <i className="fas fa-user-friends" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}></i>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Not following anyone yet</p>
                  {isOwnProfile && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                      Follow people to see their posts!
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {profile.following.map(followingUser => (
                    <Link
                      key={followingUser._id}
                      to={`/profile/${followingUser._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '20px',
                        textDecoration: 'none'
                      }}
                    >
                      <img
                        src={followingUser.avatar || `https://ui-avatars.com/api/?name=${followingUser.name}&background=4ecdc4&color=fff&size=48`}
                        alt={followingUser.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(78,205,196,0.3)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '4px', fontSize: '15px' }}>{followingUser.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                          @{followingUser.name.toLowerCase().replace(/\s/g, '')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          user={profile}
        />
      )}
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
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
            fetchProfile();
          }}
          stories={[selectedStory]}
          initialIndex={0}
        />
      )}

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </>
  );
};

export default Profile;