import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { getUserChats, getOrCreateChat, sendMessage, deleteMessage, saveCallLog, markMessagesAsRead } from '../services/api';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  const abortControllerRef = useRef(null);
  const { user } = useAuth();
  const isMarkingRef = useRef(false);

  // Connect to socket
  useEffect(() => {
    if (user && user._id && !socketRef.current) {
      console.log('🔌 Connecting to socket...');
      const socket = io('http://localhost:5000', {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
      socketRef.current = socket;
      window.socketRef = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        socket.emit('register', user._id);
      });

      socket.on('connect_error', (error) => {
        console.log('⚠️ Socket connection error:', error.message);
      });

      socket.on('receive_message', (message) => {
        console.log('📩 NEW MESSAGE RECEIVED:', message);
        
        setActiveChat(prev => {
          if (prev && prev._id === message.chatId) {
            return {
              ...prev,
              messages: [...(prev.messages || []), message],
              lastMessage: message.text,
              lastMessageTime: new Date()
            };
          }
          return prev;
        });
        
        setChats(prev => {
          const existingChatIndex = prev.findIndex(c => c._id === message.chatId);
          if (existingChatIndex !== -1) {
            const updated = [...prev];
            updated[existingChatIndex] = {
              ...updated[existingChatIndex],
              messages: [...(updated[existingChatIndex].messages || []), message],
              lastMessage: message.text,
              lastMessageTime: new Date()
            };
            return updated;
          }
          return prev;
        });
      });

      socket.on('message_deleted', (data) => {
        console.log('🗑️ Message deleted:', data);
        
        setActiveChat(prev => {
          if (prev && prev._id === data.chatId) {
            const updatedMessages = (prev.messages || []).filter(msg => msg._id !== data.messageId);
            return {
              ...prev,
              messages: updatedMessages,
              lastMessage: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].text : '',
              lastMessageTime: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].createdAt : new Date()
            };
          }
          return prev;
        });
        
        setChats(prev => prev.map(chat => {
          if (chat._id === data.chatId) {
            const updatedMessages = (chat.messages || []).filter(msg => msg._id !== data.messageId);
            return {
              ...chat,
              messages: updatedMessages,
              lastMessage: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].text : '',
              lastMessageTime: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].createdAt : new Date()
            };
          }
          return chat;
        }));
      });

      socket.on('incoming_call', (data) => {
        console.log('📞 Incoming call:', data);
        if (data.callerId !== user._id) {
          setIncomingCall(data);
        }
      });

      socket.on('call_accepted', () => {
        console.log('✅ Call accepted');
        setIsCalling(true);
        setIncomingCall(null);
      });

      socket.on('call_rejected', () => {
        console.log('❌ Call rejected');
        setIsCalling(false);
        setIncomingCall(null);
      });

      socket.on('call_ended', () => {
        console.log('🔴 Call ended');
        setIsCalling(false);
        setIncomingCall(null);
      });

      socket.on('receive_peer_id', ({ peerId, callerId }) => {
        console.log('📹 Received peer ID:', peerId);
        window.receiverPeerId = peerId;
        window.callerId = callerId;
      });

      return () => {
        console.log('🔌 Disconnecting socket');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [user]);

  // Fetch chats on user change
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('Fetching chats...');
      const { data } = await getUserChats({
        signal: abortControllerRef.current.signal
      });
      console.log('Chats fetched:', data);
      setChats(data);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error fetching chats:', error);
      }
    }
  };

  const openChat = async (userId) => {
    setLoading(true);
    try {
      console.log('Opening chat with user:', userId);
      const { data } = await getOrCreateChat(userId);
      console.log('Chat opened, messages count:', data.messages?.length);
      setActiveChat(data);
      if (!chats.find(c => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      return data;
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToChat = async (chatId, text, receiverId, replyTo = null) => {
    if (!text.trim()) return;
    
    console.log('📤 Sending message:', { chatId, text, receiverId, replyTo });
    
    try {
      let chatData;
      if (!chatId) {
        const newChat = await openChat(receiverId);
        chatId = newChat._id;
      }
      
      const { data } = await sendMessage(chatId, text, replyTo);
      console.log('Message saved to DB, new messages count:', data.messages?.length);
      
      setActiveChat(data);
      setChats(prev => prev.map(chat => chat._id === chatId ? data : chat));

      const newMessage = data.messages[data.messages.length - 1];
      
      if (socketRef.current && receiverId) {
        socketRef.current.emit('send_message', {
          receiverId,
          message: { ...newMessage, chatId }
        });
        console.log('✅ Message emitted to socket');
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessageFromChat = async (chatId, messageId, receiverId) => {
    try {
      console.log('🗑️ Deleting message:', { chatId, messageId });
      const { data } = await deleteMessage(chatId, messageId);
      setActiveChat(data);
      setChats(prev => prev.map(chat => chat._id === chatId ? data : chat));
      
      if (socketRef.current && receiverId) {
        socketRef.current.emit('delete_message', {
          receiverId,
          chatId,
          messageId,
          deleteForEveryone: true
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const markChatAsRead = async (chatId) => {
    // Prevent infinite loop
    if (isMarkingRef.current) return;
    isMarkingRef.current = true;
    
    try {
      console.log('📖 Marking chat as read:', chatId);
      const { data } = await markMessagesAsRead(chatId);
      // Only update if active chat matches
      if (activeChat && activeChat._id === chatId) {
        setActiveChat(data);
      }
      setChats(prev => prev.map(chat => chat._id === chatId ? data : chat));
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error marking as read:', error);
      }
    } finally {
      setTimeout(() => {
        isMarkingRef.current = false;
      }, 500);
    }
  };

  const startCall = async (chatId, callType, receiverId, receiverName) => {
    if (socketRef.current) {
      socketRef.current.emit('start_call', {
        callerId: user._id,
        callerName: user.name,
        receiverId,
        callType
      });
      setIsCalling(true);
    }
  };

  const acceptCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('accept_call', {
        callerId: incomingCall.callerId,
        receiverId: user._id,
        receiverName: user.name
      });
      setIsCalling(true);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('reject_call', {
        callerId: incomingCall.callerId,
        receiverId: user._id
      });
      setIncomingCall(null);
    }
  };

  const endCall = async (chatId, receiverId, duration, callType) => {
    if (socketRef.current) {
      socketRef.current.emit('end_call', { receiverId });
    }
    
    if (chatId && duration > 0) {
      try {
        await saveCallLog(chatId, callType, duration, 'answered');
        await fetchChats();
        if (receiverId) await openChat(receiverId);
      } catch (error) {
        console.error('Error saving call log:', error);
      }
    }
    
    setIsCalling(false);
    setIncomingCall(null);
  };

  const sendStoryReply = async (storyOwnerId, replyText, storyData) => {
    try {
      const chat = await openChat(storyOwnerId);
      const replyMessage = `📸 **Story Reply**\n\n"${replyText}"\n\n🔗 Replying to ${storyData.user?.name}'s story: ${storyData.caption || 'Story'}`;
      
      const { data } = await sendMessage(chat._id, replyMessage);
      
      const storyRefs = JSON.parse(localStorage.getItem('story_replies') || '{}');
      storyRefs[data.messages[data.messages.length - 1]._id] = {
        storyId: storyData._id,
        storyMedia: storyData.media,
        storyCaption: storyData.caption,
        storyOwner: storyData.user,
        reply: replyText
      };
      localStorage.setItem('story_replies', JSON.stringify(storyRefs));
      
      return data;
    } catch (error) {
      console.error('Error sending story reply:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      loading,
      isCalling,
      incomingCall,
      openChat,
      sendMessageToChat,
      deleteMessageFromChat,
      fetchChats,
      startCall,
      endCall,
      acceptCall,
      rejectCall,
      markChatAsRead,
      sendStoryReply,
      setActiveChat,
      setChats
    }}>
      {children}
    </ChatContext.Provider>
  );
};