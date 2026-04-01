import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { markMessagesAsRead } from '../services/api';

const Inbox = ({ isOpen, onClose }) => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { chats: chatList, fetchChats } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatList && user) {
      // Remove duplicate chats with same participants
      const uniqueChatsMap = new Map();
      
      chatList.forEach(chat => {
        const otherParticipant = chat.participants?.find(p => p._id !== user?._id);
        if (!otherParticipant) return;
        
        const key = otherParticipant._id;
        
        // Keep only the best chat (with messages or latest)
        if (!uniqueChatsMap.has(key) || 
            (chat.messages?.length > 0 && uniqueChatsMap.get(key).messages?.length === 0) ||
            (new Date(chat.lastMessageTime) > new Date(uniqueChatsMap.get(key).lastMessageTime))) {
          
          const unreadCount = chat.messages?.filter(
            msg => msg.sender?._id !== user?._id && !msg.read
          ).length || 0;
          
          uniqueChatsMap.set(key, { ...chat, unreadCount, otherParticipant });
        }
      });
      
      const uniqueChats = Array.from(uniqueChatsMap.values());
      // Sort by last message time
      uniqueChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      setChats(uniqueChats);
      setLoading(false);
    }
  }, [chatList, user]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (diff > 1000 * 60 * 60) {
      return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
    } else if (diff > 1000 * 60) {
      return `${Math.floor(diff / (1000 * 60))}m ago`;
    } else {
      return 'Just now';
    }
  };

  const openChat = async (chat, otherUser) => {
    try {
      await markMessagesAsRead(chat._id);
    } catch (error) {
      // Ignore abort errors
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error marking as read:', error);
      }
    }
    
    // Close inbox
    onClose();
    
    // Set global variable to open chat on home page
    window.openChatWithUser = otherUser;
    window.openChatId = chat._id;
    
    // Dispatch custom event for home page
    window.dispatchEvent(new CustomEvent('openChat', { 
      detail: { user: otherUser, chatId: chat._id } 
    }));
    
    // Navigate to home page
    navigate('/');
    
    // Ensure chat opens after navigation
    setTimeout(() => {
      window.openChatWithUser = otherUser;
    }, 150);
  };

  const filteredChats = chats.filter(chat => {
    return chat.otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalUnread = chats.filter(c => c.unreadCount > 0).length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '480px',
        height: '650px',
        background: '#1e1e2e',
        borderRadius: '28px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: '#2d2d3a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: '600' }}>
              <i className="fas fa-inbox" style={{ marginRight: '12px', color: '#4ecdc4' }}></i>
              Messages
            </h2>
            <p style={{ color: '#888', margin: '4px 0 0 36px', fontSize: '12px' }}>
              {totalUnread} unread {totalUnread === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            background: '#3a3a4a',
            borderRadius: '40px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s'
          }}>
            <i className="fas fa-search" style={{ color: '#888', fontSize: '14px' }}></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                outline: 'none',
                width: '100%',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '40px' }}></i>
              <p style={{ marginTop: '16px' }}>Loading conversations...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
              <i className="fas fa-comments" style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.5 }}></i>
              <p style={{ fontSize: '16px' }}>No messages yet</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Start a conversation with someone!</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = chat.otherParticipant;
              const lastMessage = chat.messages?.[chat.messages.length - 1];
              const unreadCount = chat.unreadCount || 0;
              
              return (
                <div
                  key={chat._id}
                  onClick={() => openChat(chat, otherUser)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '4px',
                    background: unreadCount > 0 ? 'rgba(78,205,196,0.1)' : 'transparent'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2d2d3a'; }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.background = unreadCount > 0 ? 'rgba(78,205,196,0.1)' : 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    <img
                      src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=4ecdc4&color=fff&size=52&bold=true`}
                      alt={otherUser?.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: unreadCount > 0 ? '2px solid #4ecdc4' : '2px solid transparent'
                      }}
                    />
                    {unreadCount > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        background: '#4ecdc4',
                        color: '#1e1e2e',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #1e1e2e'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: unreadCount > 0 ? '700' : '500'
                      }}>
                        {otherUser?.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      {lastMessage?.isCall ? (
                        <i className={lastMessage.callType === 'audio' ? 'fas fa-phone' : 'fas fa-video'} 
                           style={{ fontSize: '11px', color: lastMessage.callStatus === 'missed' ? '#ff6b6b' : '#888' }}></i>
                      ) : (
                        lastMessage && lastMessage.sender?._id !== user?._id && !lastMessage.read && (
                          <i className="fas fa-circle" style={{ fontSize: '8px', color: '#4ecdc4' }}></i>
                        )
                      )}
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: unreadCount > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                        fontWeight: unreadCount > 0 ? '500' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '250px'
                      }}>
                        {lastMessage?.text || (lastMessage?.isCall ? lastMessage.text : 'No messages yet')}
                      </p>
                    </div>
                  </div>
                  
                  <i className="fas fa-chevron-right" style={{ color: '#888', fontSize: '12px', opacity: 0.6 }}></i>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inbox;