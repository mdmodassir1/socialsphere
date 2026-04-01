import { useState, useEffect } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const { dashboard, loading, timeRange, setTimeRange, fetchDashboard } = useAnalytics();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      fetchDashboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '20px',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: `rgba(${color},0.2)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={icon} style={{ fontSize: '24px', color: `rgb(${color})` }}></i>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{formatNumber(value)}</div>
          <div style={{ fontSize: '13px', color: '#888' }}>{title}</div>
        </div>
      </div>
      {subtitle && <div style={{ fontSize: '11px', color: '#4ecdc4', marginTop: '8px' }}>{subtitle}</div>}
    </div>
  );

  const ChartBar = ({ label, value, maxValue, color }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: '#aaa' }}>{label}</span>
        <span style={{ color: 'white' }}>{value}</span>
      </div>
      <div style={{
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(value / maxValue) * 100}%`,
          height: '100%',
          background: `rgb(${color})`,
          borderRadius: '4px',
          transition: 'width 0.5s'
        }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '40px' }}></i>
          <p style={{ marginTop: '16px' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const weeklyData = dashboard?.weeklyData || { views: [], likes: [], comments: [], shares: [] };
  const topPosts = dashboard?.topPosts || [];
  const recentActivity = dashboard?.recentActivity || { views: [], posts: [] };

  const maxWeeklyValue = Math.max(...weeklyData.views, ...weeklyData.likes, ...weeklyData.comments, ...weeklyData.shares, 1);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: '20px'
    }}>
      <div style={{
        width: '1000px',
        maxWidth: '95%',
        maxHeight: '90vh',
        background: '#1e1e2e',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: '#2d2d3a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
              <i className="fas fa-chart-line" style={{ marginRight: '12px', color: '#4ecdc4' }}></i>
              Analytics Dashboard
            </h2>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>
              Insights and statistics for {user?.name}'s profile
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                background: '#3a3a4a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '0 20px'
        }}>
          {['overview', 'posts', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                color: activeTab === tab ? '#4ecdc4' : '#888',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                borderBottom: activeTab === tab ? '2px solid #4ecdc4' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <StatCard icon="fas fa-eye" title="Profile Views" value={overview.totalProfileViews || 0} color="78,205,196" />
                <StatCard icon="fas fa-chart-line" title="Post Views" value={overview.totalPostViews || 0} color="102,126,234" />
                <StatCard icon="fas fa-heart" title="Total Likes" value={overview.totalLikes || 0} color="255,107,107" />
                <StatCard icon="fas fa-comment" title="Comments" value={overview.totalComments || 0} color="255,159,67" />
                <StatCard icon="fas fa-share-alt" title="Shares" value={overview.totalShares || 0} color="78,205,196" />
                <StatCard icon="fas fa-users" title="Followers" value={overview.totalFollowers || 0} color="102,126,234" />
                <StatCard icon="fas fa-user-friends" title="Following" value={overview.totalFollowing || 0} color="255,107,107" />
                <StatCard icon="fas fa-chart-simple" title="Engagement" value={overview.totalEngagement || 0} color="78,205,196" subtitle="Likes + Comments + Shares" />
              </div>

              {/* Weekly Chart */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '18px' }}>
                  <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                  Weekly Performance
                </h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#aaa', marginBottom: '12px', fontSize: '13px' }}>Profile Views</h4>
                    {weeklyData.labels.map((label, i) => (
                      <ChartBar key={i} label={label} value={weeklyData.views[i]} maxValue={maxWeeklyValue} color="78,205,196" />
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#aaa', marginBottom: '12px', fontSize: '13px' }}>Engagement</h4>
                    <ChartBar label="Likes" value={weeklyData.likes.reduce((a, b) => a + b, 0)} maxValue={maxWeeklyValue} color="255,107,107" />
                    <ChartBar label="Comments" value={weeklyData.comments.reduce((a, b) => a + b, 0)} maxValue={maxWeeklyValue} color="255,159,67" />
                    <ChartBar label="Shares" value={weeklyData.shares.reduce((a, b) => a + b, 0)} maxValue={maxWeeklyValue} color="78,205,196" />
                  </div>
                </div>
              </div>

              {/* Top Posts */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
                  <i className="fas fa-fire" style={{ marginRight: '8px', color: '#ff6b6b' }}></i>
                  Top Performing Posts
                </h3>
                {topPosts.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No posts yet</p>
                ) : (
                  topPosts.map((post, idx) => (
                    <Link
                      key={post._id}
                      to={`/post/${post._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#4ecdc4',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1e1e2e'
                      }}>
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '13px', marginBottom: '4px' }}>
                          {post.content?.substring(0, 60)}...
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#888' }}>
                          <span><i className="fas fa-eye"></i> {post.views} views</span>
                          <span><i className="fas fa-heart"></i> {post.likes} likes</span>
                          <span><i className="fas fa-comment"></i> {post.comments} comments</span>
                          <span><i className="fas fa-share-alt"></i> {post.shares} shares</span>
                        </div>
                      </div>
                      <div style={{ color: '#4ecdc4', fontSize: '13px', fontWeight: 'bold' }}>
                        {post.engagement} engagement
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'posts' && (
            <div>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>All Posts Analytics</h3>
              {topPosts.map(post => (
                <div key={post._id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {post.image && (
                      <img src={post.image} alt="post" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', marginBottom: '8px' }}>{post.content?.substring(0, 100)}...</p>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div><span style={{ color: '#4ecdc4' }}>{post.views}</span> <span style={{ color: '#888' }}>views</span></div>
                    <div><span style={{ color: '#ff6b6b' }}>{post.likes}</span> <span style={{ color: '#888' }}>likes</span></div>
                    <div><span style={{ color: '#ff9f43' }}>{post.comments}</span> <span style={{ color: '#888' }}>comments</span></div>
                    <div><span style={{ color: '#4ecdc4' }}>{post.shares}</span> <span style={{ color: '#888' }}>shares</span></div>
                    <div><span style={{ color: '#fff' }}>{post.engagement}</span> <span style={{ color: '#888' }}>total engagement</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Recent Views */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '16px' }}>
                  <i className="fas fa-eye" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                  Recent Profile Views
                </h3>
                {recentActivity.views?.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No recent views</p>
                ) : (
                  recentActivity.views?.map(view => (
                    <Link
                      key={view._id}
                      to={`/profile/${view.viewer?._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <img
                        src={view.viewer?.avatar || `https://ui-avatars.com/api/?name=${view.viewer?.name}&background=4ecdc4&color=fff&size=40`}
                        alt="avatar"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '14px' }}>{view.viewer?.name}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{new Date(view.viewedAt).toLocaleString()}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Recent Posts */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '16px' }}>
                  <i className="fas fa-newspaper" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                  Recent Posts
                </h3>
                {recentActivity.posts?.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No posts yet</p>
                ) : (
                  recentActivity.posts?.map(post => (
                    <Link
                      key={post._id}
                      to={`/post/${post._id}`}
                      style={{
                        display: 'block',
                        padding: '10px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        marginBottom: '8px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ color: 'white', fontSize: '13px', marginBottom: '4px' }}>
                        {post.content?.substring(0, 80)}...
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#888' }}>
                        <span><i className="fas fa-heart"></i> {post.likes?.length || 0}</span>
                        <span><i className="fas fa-comment"></i> {post.comments?.length || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;