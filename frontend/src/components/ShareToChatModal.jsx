import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../services/api';

const ShareToChatModal = ({ isOpen, onClose, post }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { chats: chatList, fetchChats, sendMessageToChat } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatList) {
      setChats(chatList);
      setLoading(false);
    }
  }, [chatList]);

  const handleShareToChat = async (chat, otherUser) => {
    if (!post) return;
    
    setSending(true);
    try {
      const shareMessage = `📱 **Shared a post**\n\n${post.content}\n\n🔗 [View Post](${window.location.origin}/post/${post._id})`;
      await sendMessageToChat(chat._id, shareMessage, otherUser._id);
      alert('Post shared to chat!');
      onClose();
    } catch (error) {
      console.error('Error sharing to chat:', error);
      alert('Failed to share post');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

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
      <div style={{
        width: '400px',
        maxHeight: '500px',
        background: '#1e1e2e',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          background: '#2d2d3a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>Share to Chat</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: '#2d2d3a',
            borderRadius: '12px'
          }}>
            {post?.image && (
              <img src={post.image} alt="post" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ color: '#4ecdc4', fontSize: '12px', marginBottom: '4px' }}>Shared post</div>
              <div style={{ color: 'white', fontSize: '13px' }}>{post?.content?.substring(0, 80)}...</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '30px' }}></i>
              <p>Loading chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <p>No chats yet</p>
            </div>
          ) : (
            chats.map(chat => {
              const otherUser = chat.participants?.find(p => p._id !== user?._id);
              if (!otherUser) return null;
              
              return (
                <div
                  key={chat._id}
                  onClick={() => handleShareToChat(chat, otherUser)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2d2d3a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <img
                    src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}&background=4ecdc4&color=fff&size=40`}
                    alt={otherUser.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: '500' }}>{otherUser.name}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{chat.lastMessage?.substring(0, 40) || 'No messages yet'}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#888' }}></i>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareToChatModal;