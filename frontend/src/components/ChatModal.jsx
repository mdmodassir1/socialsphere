import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { sendMediaMessage, toggleReaction } from '../services/api';
import CallModal from './CallModal';
import VoiceRecorder from './VoiceRecorder';
import VideoRecorder from './VideoRecorder';
import ReactionPicker from './ReactionPicker';

const ChatModal = ({ isOpen, onClose, user: otherUser }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState({ open: false, messageId: null });
  const [replyTo, setReplyTo] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [reactionPicker, setReactionPicker] = useState({ open: false, messageId: null });
  const { 
    activeChat, 
    openChat, 
    sendMessageToChat, 
    deleteMessageFromChat,
    isCalling, 
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
    startCall,
    markChatAsRead,
    fetchChats,
    setActiveChat,
    setChats
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    if (isOpen && otherUser?._id) {
      setLoadingChat(true);
      openChat(otherUser._id).then(() => {
        setLoadingChat(false);
      });
    }
  }, [isOpen, otherUser]);

  useEffect(() => {
    if (activeChat) {
      const storyRefs = JSON.parse(localStorage.getItem('story_replies') || '{}');
      const updatedMessages = (activeChat.messages || []).map(msg => {
        if (msg.text?.includes('📸 **Story Reply**') && storyRefs[msg._id]) {
          return { ...msg, storyData: storyRefs[msg._id] };
        }
        return msg;
      });
      
      const currentLength = updatedMessages.length;
      setMessages(updatedMessages);
      
      if (currentLength > prevMessagesLength.current) {
        scrollToBottom();
      }
      prevMessagesLength.current = currentLength;
      
      if (activeChat._id && activeChat.messages?.length > 0) {
        const hasUnread = activeChat.messages.some(
          msg => msg.sender?._id !== user?._id && !msg.read
        );
        if (hasUnread) {
          markChatAsRead(activeChat._id);
        }
      }
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleReply = (msg) => {
    setReplyTo({
      messageId: msg._id,
      text: msg.text,
      senderName: msg.sender?.name,
      senderId: msg.sender?._id
    });
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessageToChat(activeChat._id, message, otherUser._id, replyTo);
    setMessage('');
    cancelReply();
  };

  const handleReaction = async (messageId, type) => {
    if (!activeChat) return;
    try {
      const { data } = await toggleReaction(activeChat._id, messageId, type);
      setActiveChat(data);
      setChats(prev => prev.map(chat => chat._id === activeChat._id ? data : chat));
      setReactionPicker({ open: false, messageId: null });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleVoiceNote = async (audioBlob, mediaType, duration) => {
    if (!activeChat || !otherUser) return;
    
    const formData = new FormData();
    formData.append('media', audioBlob);
    formData.append('mediaType', mediaType);
    formData.append('mediaDuration', duration);
    
    try {
      const { data } = await sendMediaMessage(activeChat._id, formData);
      setActiveChat(data);
      setChats(prev => prev.map(chat => chat._id === activeChat._id ? data : chat));
      setShowVoiceRecorder(false);
      fetchChats();
    } catch (error) {
      console.error('Error sending voice note:', error);
      alert('Failed to send voice note');
    }
  };

  const handleVideoNote = async (videoBlob, mediaType, duration) => {
    if (!activeChat || !otherUser) return;
    
    const formData = new FormData();
    formData.append('media', videoBlob);
    formData.append('mediaType', mediaType);
    formData.append('mediaDuration', duration);
    
    try {
      const { data } = await sendMediaMessage(activeChat._id, formData);
      setActiveChat(data);
      setChats(prev => prev.map(chat => chat._id === activeChat._id ? data : chat));
      setShowVideoRecorder(false);
      fetchChats();
    } catch (error) {
      console.error('Error sending video note:', error);
      alert('Failed to send video note');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeChat || !otherUser) return;
    await deleteMessageFromChat(activeChat._id, messageId, otherUser._id);
    setDeleteMenu({ open: false, messageId: null });
  };

  const handleStartCall = async (type) => {
    if (!activeChat || !otherUser) return;
    setCallType(type);
    setIsCaller(true);
    setShowCallModal(true);
    await startCall(activeChat._id, type, otherUser._id, otherUser.name);
  };

  const handleEndCall = async (duration) => {
    setShowCallModal(false);
    if (activeChat && otherUser) {
      await endCall(activeChat._id, otherUser._id, duration, callType);
    }
    setCallType(null);
    setIsCaller(false);
  };

  const openStoryFromReply = (storyData) => {
    if (storyData) {
      window.openStoryWithData = storyData;
      window.dispatchEvent(new CustomEvent('openStory', { detail: storyData }));
      onClose();
    }
  };

  const getReactionEmoji = (type) => {
    switch (type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'laugh': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😠';
      default: return '👍';
    }
  };

  const getReactionSummary = (reactions) => {
    const summary = {};
    reactions.forEach(r => {
      if (!summary[r.type]) summary[r.type] = { count: 0, users: [] };
      summary[r.type].count++;
      summary[r.type].users.push(r.user);
    });
    return summary;
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'voice_note': return '🎤';
      case 'video_note': return '📹';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📎';
    }
  };

  if (!isOpen || !otherUser) return null;

  if (loadingChat) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '520px',
        background: '#1e1e2e', borderRadius: '20px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '30px' }}></i>
          <p style={{ marginTop: '10px' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCallModal && (
        <CallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          callType={callType}
          isCaller={isCaller}
          otherUser={otherUser}
          onEndCall={handleEndCall}
          chatId={activeChat?._id}
        />
      )}

      {incomingCall && incomingCall.callerId === otherUser._id && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#1e1e2e', borderRadius: '24px', padding: '32px 48px', zIndex: 10000,
          textAlign: 'center', minWidth: '320px', border: '2px solid #4ecdc4',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📞</div>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Incoming Call</h3>
          <p style={{ color: '#4ecdc4', fontSize: '18px', marginBottom: '24px' }}>{incomingCall.callerName}</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button onClick={() => { acceptCall(); setCallType(incomingCall.callType); setIsCaller(false); setShowCallModal(true); }}
              style={{ background: '#4ecdc4', border: 'none', padding: '10px 32px', borderRadius: '40px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Accept</button>
            <button onClick={rejectCall}
              style={{ background: '#ff6b6b', border: 'none', padding: '10px 32px', borderRadius: '40px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Reject</button>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '520px',
        background: '#1e1e2e', borderRadius: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 1000, overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px', background: '#2d2d3a', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to={`/profile/${otherUser._id}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=4ecdc4&color=fff&size=40`}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div><h4 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{otherUser?.name}</h4><span style={{ fontSize: '10px', color: '#4ecdc4' }}>● Online</span></div>
          </Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleStartCall('audio')} style={{ background: 'rgba(78,205,196,0.2)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', color: '#4ecdc4', cursor: 'pointer', fontSize: '14px' }}><i className="fas fa-phone"></i></button>
            <button onClick={() => handleStartCall('video')} style={{ background: 'rgba(78,205,196,0.2)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', color: '#4ecdc4', cursor: 'pointer', fontSize: '14px' }}><i className="fas fa-video"></i></button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div style={{ padding: '10px 16px', background: '#2d2d3a', borderLeft: '3px solid #4ecdc4', margin: '8px 12px 0 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#4ecdc4', marginBottom: '2px' }}>Replying to {replyTo.senderName === user?.name ? 'yourself' : replyTo.senderName}</div>
              <div style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.text?.length > 50 ? replyTo.text.substring(0, 50) + '...' : replyTo.text}</div>
            </div>
            <button onClick={cancelReply} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>✕</button>
          </div>
        )}

        {/* Call Active State */}
        {isCalling && !incomingCall && !showCallModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 20, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
              <h3 style={{ color: 'white' }}>Calling {otherUser?.name}...</h3>
              <button onClick={() => endCall(activeChat?._id, otherUser?._id, 0, callType)} style={{ background: '#ff6b6b', border: 'none', padding: '10px 30px', borderRadius: '30px', color: 'white', marginTop: '20px', cursor: 'pointer' }}>End Call</button>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}><i className="fas fa-comments" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>No messages yet</div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender?._id === user?._id;
              const hasReply = msg.replyTo?.messageId;
              const isStoryReply = msg.text?.includes('📸 **Story Reply**');
              const isMedia = msg.media && msg.mediaType;
              const reactions = msg.reactions || [];
              const reactionSummary = getReactionSummary(reactions);
              
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px', width: '100%', position: 'relative' }}>
                  {/* Reply Preview */}
                  {hasReply && (
                    <div style={{ maxWidth: '85%', marginBottom: '4px', padding: '4px 8px', background: 'rgba(78,205,196,0.1)', borderRadius: '8px', borderLeft: '2px solid #4ecdc4', fontSize: '11px', color: '#aaa' }}>
                      <span style={{ color: '#4ecdc4', fontSize: '10px' }}>↪️ {msg.replyTo.senderName === user?.name ? 'You' : msg.replyTo.senderName}</span>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.replyTo.text?.length > 60 ? msg.replyTo.text.substring(0, 60) + '...' : msg.replyTo.text}</div>
                    </div>
                  )}
                  
                  {/* Main Message */}
                  <div style={{ maxWidth: '70%', background: isOwn ? '#4ecdc4' : '#3a3a4a', padding: '8px 12px', borderRadius: '16px', color: 'white', position: 'relative', cursor: 'pointer' }} onDoubleClick={() => handleReply(msg)}>
                    {isMedia ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '20px' }}>{getMediaIcon(msg.mediaType)}</span>
                          <span style={{ fontSize: '13px' }}>{msg.text}</span>
                          {msg.mediaDuration > 0 && <span style={{ fontSize: '10px', opacity: 0.7 }}>{Math.floor(msg.mediaDuration / 60)}:{String(msg.mediaDuration % 60).padStart(2, '0')}</span>}
                        </div>
                        {msg.mediaType === 'voice_note' && <audio controls src={msg.media} style={{ width: '100%', marginTop: '8px', borderRadius: '20px' }} />}
                        {msg.mediaType === 'video_note' && <video controls src={msg.media} style={{ width: '100%', borderRadius: '12px', marginTop: '8px' }} />}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    )}
                    <span style={{ fontSize: '9px', opacity: 0.7, display: 'block', marginTop: '4px', textAlign: isOwn ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isStoryReply && msg.storyData && (
                      <div onClick={() => openStoryFromReply(msg.storyData)} style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(78,205,196,0.2)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4ecdc4' }}>
                        <i className="fas fa-play-circle"></i><span>View original story</span>
                      </div>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {Object.keys(reactionSummary).length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px', marginLeft: isOwn ? 'auto' : '0', marginRight: isOwn ? '0' : 'auto' }}>
                      {Object.entries(reactionSummary).slice(0, 3).map(([type, data]) => (
                        <div key={type} style={{ background: '#2d2d3a', borderRadius: '20px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}>
                          <span>{getReactionEmoji(type)}</span>
                          {data.count > 1 && <span style={{ fontSize: '10px', color: '#aaa' }}>{data.count}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Actions */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button onClick={() => handleReply(msg)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onMouseEnter={(e) => { e.target.style.background = '#2d2d3a'; e.target.style.color = '#4ecdc4'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#888'; }}>
                      <i className="fas fa-reply" style={{ fontSize: '10px' }}></i><span>Reply</span>
                    </button>
                    
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setReactionPicker({ open: reactionPicker.open === idx ? false : idx, messageId: msg._id })}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onMouseEnter={(e) => { e.target.style.background = '#2d2d3a'; e.target.style.color = '#ffaa44'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#888'; }}>
                        <i className="far fa-smile" style={{ fontSize: '10px' }}></i><span>React</span>
                      </button>
                      {reactionPicker.open === idx && (
                        <ReactionPicker onSelect={(type) => handleReaction(msg._id, type)} onClose={() => setReactionPicker({ open: false, messageId: null })} />
                      )}
                    </div>

                    {isOwn && (
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setDeleteMenu({ open: deleteMenu.open === idx ? false : idx, messageId: msg._id })}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onMouseEnter={(e) => { e.target.style.background = '#2d2d3a'; e.target.style.color = '#ff6b6b'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#888'; }}>
                          <i className="fas fa-trash-alt" style={{ fontSize: '10px' }}></i><span>Delete</span>
                        </button>
                        {deleteMenu.open === idx && (
                          <div style={{ position: 'absolute', top: '28px', right: '0', background: '#2d2d3a', borderRadius: '8px', padding: '8px 0', zIndex: 20, minWidth: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button onClick={() => handleDeleteMessage(msg._id)} style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onMouseEnter={(e) => { e.target.style.background = '#3a3a4a'; }} onMouseLeave={(e) => { e.target.style.background = 'none'; }}>
                              <i className="fas fa-trash-alt"></i><span>Delete for me</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '12px', borderTop: '1px solid #3a3a4a', background: '#1e1e2e' }}>
          {showVoiceRecorder && <VoiceRecorder onSend={handleVoiceNote} onCancel={() => setShowVoiceRecorder(false)} disabled={!activeChat} />}
          {showVideoRecorder && <VideoRecorder onSend={handleVideoNote} onCancel={() => setShowVideoRecorder(false)} disabled={!activeChat} />}
          {!showVoiceRecorder && !showVideoRecorder && (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
                <button type="button" onClick={() => setShowVoiceRecorder(true)} style={{ background: 'rgba(78,205,196,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#4ecdc4', cursor: 'pointer', fontSize: '14px' }}><i className="fas fa-microphone"></i></button>
                <button type="button" onClick={() => setShowVideoRecorder(true)} style={{ background: 'rgba(78,205,196,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#4ecdc4', cursor: 'pointer', fontSize: '14px' }}><i className="fas fa-video"></i></button>
              </div>
              <input ref={inputRef} type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={replyTo ? 'Write your reply...' : 'Type a message...'}
                style={{ flex: 1, padding: '10px 14px', background: '#3a3a4a', border: 'none', borderRadius: '24px', color: 'white', outline: 'none', fontSize: '13px' }} />
              <button type="submit" style={{ background: '#4ecdc4', border: 'none', padding: '8px 20px', borderRadius: '24px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Send</button>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </>
  );
};

export default ChatModal;