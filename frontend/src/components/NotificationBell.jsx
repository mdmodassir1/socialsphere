import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotif } = useNotification();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <i className="fas fa-heart" style={{ color: '#ff6b6b' }}></i>;
      case 'comment': return <i className="fas fa-comment" style={{ color: '#4ecdc4' }}></i>;
      case 'follow': return <i className="fas fa-user-plus" style={{ color: '#4ecdc4' }}></i>;
      case 'message': return <i className="fas fa-envelope" style={{ color: '#4ecdc4' }}></i>;
      case 'story_reply': return <i className="fas fa-play-circle" style={{ color: '#4ecdc4' }}></i>;
      case 'call_missed': return <i className="fas fa-phone-slash" style={{ color: '#ff6b6b' }}></i>;
      default: return <i className="fas fa-bell"></i>;
    }
  };

  const getNotificationText = (notif) => {
    const fromName = notif.from?.name || 'Someone';
    switch (notif.type) {
      case 'like': return `${fromName} liked your post`;
      case 'comment': return `${fromName} commented on your post`;
      case 'follow': return `${fromName} started following you`;
      case 'message': return `${fromName} sent you a message`;
      case 'story_reply': return `${fromName} replied to your story`;
      case 'call_missed': return `${fromName} missed your call`;
      default: return `${fromName} sent a notification`;
    }
  };

  const getNotificationLink = (notif) => {
    switch (notif.type) {
      case 'like':
      case 'comment':
        return `/post/${notif.post?._id}`;
      case 'follow':
        return `/profile/${notif.from?._id}`;
      default:
        return '#';
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif._id);
    }
    setIsOpen(false);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'unread') return !notif.read;
    return true;
  });

  // For mobile, show as bottom sheet
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            color: '#e4e4e4',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            position: 'relative'
          }}
        >
          <i className="fas fa-bell" style={{ fontSize: '20px' }}></i>
          <span style={{ fontSize: '10px' }}>Alerts</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '0',
              background: '#ff6b6b',
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Mobile Bottom Sheet */}
        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 2000,
                backdropFilter: 'blur(4px)'
              }}
              onClick={() => setIsOpen(false)}
            />
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1e1e2e',
              borderRadius: '20px 20px 0 0',
              zIndex: 2001,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ color: 'white', margin: 0 }}>Notifications</h3>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setActiveTab('all')} style={{
                  flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'all' ? '#4ecdc4' : '#888', cursor: 'pointer'
                }}>All</button>
                <button onClick={() => setActiveTab('unread')} style={{
                  flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'unread' ? '#4ecdc4' : '#888', cursor: 'pointer'
                }}>Unread</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {filteredNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <i className="fas fa-bell-slash" style={{ fontSize: '40px', marginBottom: '10px', display: 'block' }}></i>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  filteredNotifications.map(notif => (
                    <Link
                      key={notif._id}
                      to={getNotificationLink(notif)}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: notif.read ? 'transparent' : 'rgba(78,205,196,0.1)',
                        textDecoration: 'none',
                        marginBottom: '8px'
                      }}
                    >
                      <img src={notif.from?.avatar || `https://ui-avatars.com/api/?name=${notif.from?.name}&background=4ecdc4&color=fff&size=40`}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          {getNotificationIcon(notif.type)}
                          <span style={{ color: 'white', fontSize: '13px' }}>{getNotificationText(notif)}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#888' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotif(notif._id); }}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Desktop dropdown
  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: '#e4e4e4',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.target.style.background = 'none'; }}
      >
        <i className="fas fa-bell" style={{ fontSize: '20px' }}></i>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: '#ff6b6b',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '45px',
          right: '0',
          width: '380px',
          maxHeight: '500px',
          background: '#1e1e2e',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#4ecdc4', fontSize: '12px', cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setActiveTab('all')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: activeTab === 'all' ? '#4ecdc4' : '#888', cursor: 'pointer', fontSize: '13px', borderBottom: activeTab === 'all' ? '2px solid #4ecdc4' : 'none' }}>All</button>
            <button onClick={() => setActiveTab('unread')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: activeTab === 'unread' ? '#4ecdc4' : '#888', cursor: 'pointer', fontSize: '13px', borderBottom: activeTab === 'unread' ? '2px solid #4ecdc4' : 'none' }}>Unread</button>
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '40px', marginBottom: '10px', display: 'block' }}></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div key={notif._id} onClick={() => handleNotificationClick(notif)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: notif.read ? 'transparent' : 'rgba(78,205,196,0.1)',
                  cursor: 'pointer'
                }}>
                  <Link to={`/profile/${notif.from?._id}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                    <img src={notif.from?.avatar || `https://ui-avatars.com/api/?name=${notif.from?.name}&background=4ecdc4&color=fff&size=40`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link to={getNotificationLink(notif)} onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {getNotificationIcon(notif.type)}
                        <span style={{ color: 'white', fontSize: '13px' }}>{getNotificationText(notif)}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#888' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                    </Link>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;