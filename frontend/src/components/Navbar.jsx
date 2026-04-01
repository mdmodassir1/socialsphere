import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Inbox from './Inbox';
import NotificationBell from './NotificationBell';
import NotificationSettings from './NotificationSettings';
import SearchModal from './SearchModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showInbox, setShowInbox] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user?._id) {
      navigate(`/profile/${user._id}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        background: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '8px 16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
            <i className="fas fa-globe" style={{ fontSize: '24px', color: '#4ecdc4' }}></i>
            {!isMobile && (
              <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SocialSphere
              </span>
            )}
          </Link>

          {user ? (
            <>
              {/* Desktop Navigation */}
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Search Button */}
                  <button
                    onClick={() => setShowSearch(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e4e4e4',
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '40px',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#4ecdc4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e4e4e4'; }}
                  >
                    <i className="fas fa-search"></i>
                    <span>Search</span>
                  </button>

                  {/* Home */}
                  <Link to="/" style={{
                    color: '#e4e4e4',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '40px',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#4ecdc4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e4e4e4'; }}>
                    <i className="fas fa-home"></i>
                    <span>Home</span>
                  </Link>

                  {/* Reels */}
                  <Link to="/reels" style={{
                    color: '#e4e4e4',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '40px',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#4ecdc4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e4e4e4'; }}>
                    <i className="fas fa-film"></i>
                    <span>Reels</span>
                  </Link>

                  {/* Messages */}
                  <button onClick={() => setShowInbox(true)} style={{
                    background: 'none',
                    border: 'none',
                    color: '#e4e4e4',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '40px',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#4ecdc4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e4e4e4'; }}>
                    <i className="fas fa-inbox"></i>
                    <span>Messages</span>
                  </button>

                  {/* Notifications */}
                  <NotificationBell />

                  {/* Profile */}
                  <div onClick={handleProfileClick} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '40px',
                    background: 'rgba(78,205,196,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4ecdc4&color=fff`}
                      alt="avatar"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4ecdc4' }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'white' }}>{user.name}</span>
                  </div>

                  {/* Settings */}
                  <button onClick={() => setShowSettings(true)} style={{
                    background: 'none',
                    border: 'none',
                    color: '#e4e4e4',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#4ecdc4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#e4e4e4'; }}>
                    <i className="fas fa-cog" style={{ fontSize: '18px' }}></i>
                  </button>

                  {/* Logout */}
                  <button onClick={handleLogout} style={{
                    background: 'rgba(255,107,107,0.2)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    padding: '8px 20px',
                    borderRadius: '40px',
                    color: '#ff6b6b',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                    onMouseEnter={(e) => { e.target.style.background = '#ff6b6b'; e.target.style.color = 'white'; e.target.style.borderColor = '#ff6b6b'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(255,107,107,0.2)'; e.target.style.color = '#ff6b6b'; e.target.style.borderColor = 'rgba(255,107,107,0.3)'; }}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}

              {/* Mobile Navigation - Icon Only */}
              {isMobile && (
                <>
                  {/* Top Row - Logo and Menu Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Search Button on Mobile */}
                    <button
                      onClick={() => setShowSearch(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '8px'
                      }}
                    >
                      <i className="fas fa-search" style={{ fontSize: '20px' }}></i>
                    </button>
                    
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '8px'
                      }}
                    >
                      <i className={mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                    </button>
                  </div>

                  {/* Mobile Bottom Navigation Bar (Always Visible) */}
                  <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(30, 30, 46, 0.95)',
                    backdropFilter: 'blur(15px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '8px 12px',
                    zIndex: 1000
                  }}>
                    {/* Search */}
                    <button onClick={() => setShowSearch(true)} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#e4e4e4',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-search" style={{ fontSize: '20px' }}></i>
                      <span style={{ fontSize: '10px' }}>Search</span>
                    </button>

                    {/* Home */}
                    <Link to="/" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#e4e4e4',
                      textDecoration: 'none',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-home" style={{ fontSize: '20px' }}></i>
                      <span style={{ fontSize: '10px' }}>Home</span>
                    </Link>

                    {/* Reels */}
                    <Link to="/reels" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#e4e4e4',
                      textDecoration: 'none',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-film" style={{ fontSize: '20px' }}></i>
                      <span style={{ fontSize: '10px' }}>Reels</span>
                    </Link>

                    {/* Messages */}
                    <button onClick={() => setShowInbox(true)} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#e4e4e4',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-inbox" style={{ fontSize: '20px' }}></i>
                      <span style={{ fontSize: '10px' }}>Messages</span>
                    </button>

                    {/* Notifications */}
                    <div style={{ position: 'relative' }}>
                      <NotificationBell />
                    </div>

                    {/* Profile */}
                    <div onClick={handleProfileClick} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4ecdc4&color=fff`}
                        alt="avatar"
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #4ecdc4' }}
                      />
                      <span style={{ fontSize: '10px', color: '#e4e4e4' }}>Profile</span>
                    </div>

                    {/* Settings */}
                    <button onClick={() => setShowSettings(true)} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#e4e4e4',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-cog" style={{ fontSize: '20px' }}></i>
                      <span style={{ fontSize: '10px' }}>Settings</span>
                    </button>
                  </div>

                  {/* Mobile Menu Overlay (for additional options like Logout) */}
                  {mobileMenuOpen && (
                    <div style={{
                      position: 'fixed',
                      top: '60px',
                      right: '16px',
                      background: '#2d2d3a',
                      borderRadius: '16px',
                      padding: '12px',
                      minWidth: '150px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      zIndex: 1001
                    }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'rgba(255,107,107,0.2)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" style={{ padding: '8px 20px', borderRadius: '40px', color: '#e4e4e4', textDecoration: 'none', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}>Login</Link>
              <Link to="/register" style={{ background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)', padding: '8px 20px', borderRadius: '40px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Register</Link>
            </div>
          )}
        </div>
      </nav>

      <Inbox isOpen={showInbox} onClose={() => setShowInbox(false)} />
      <NotificationSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;