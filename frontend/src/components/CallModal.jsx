import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import API from '../services/api';

const CallModal = ({ isOpen, onClose, callType, isCaller, otherUser, onEndCall, chatId }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startTimer();
      initPeer();
      return () => {
        stopTimer();
        endCallCleanup();
      };
    }
  }, [isOpen]);

  const startTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const initPeer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        path: '/',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        localStorage.setItem('peerId', id);
        
        if (isCaller && window.socketRef && otherUser?._id) {
          window.socketRef.emit('send_peer_id', {
            receiverId: otherUser._id,
            peerId: id,
            callerId: otherUser._id
          });
        }
      });

      peer.on('call', (incomingCall) => {
        if (localStreamRef.current) {
          incomingCall.answer(localStreamRef.current);
        }
        
        incomingCall.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      });

      if (window.socketRef && !isCaller) {
        window.socketRef.on('receive_peer_id', ({ peerId, callerId }) => {
          if (callerId === otherUser?._id && peerRef.current && localStreamRef.current) {
            const newCall = peerRef.current.call(peerId, localStreamRef.current);
            newCall.on('stream', (remoteStream) => {
              setRemoteStream(remoteStream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
          }
        });
      }

      if (isCaller && window.receiverPeerId && window.callerId === otherUser?._id) {
        const newCall = peer.call(window.receiverPeerId, localStreamRef.current);
        newCall.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
        window.receiverPeerId = null;
        window.callerId = null;
      }

    } catch (error) {
      console.error('Call error:', error);
      onEndCall(0);
    }
  };

  const endCallCleanup = () => {
    stopTimer();
    
    if (chatId && callDuration > 0) {
      API.post(`/chats/${chatId}/call-log`, {
        callType,
        duration: callDuration,
        status: 'answered'
      }).catch(console.error);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    localStorage.removeItem('peerId');
    onEndCall(callDuration);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column'
    }}>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#1a1a2e' }}
      />
      
      {callType === 'video' && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute', bottom: '80px', right: '20px',
            width: '120px', height: '160px', borderRadius: '12px',
            objectFit: 'cover', border: '2px solid #4ecdc4', zIndex: 10, background: '#000'
          }}
        />
      )}
      
      <div style={{
        position: 'absolute', top: '20px', left: '20px',
        background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px',
        color: 'white', zIndex: 10
      }}>
        {otherUser?.name} • {formatTime(callDuration)}
      </div>
      
      <div style={{
        position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.8)',
        padding: '10px 20px', borderRadius: '50px', zIndex: 10
      }}>
        <button onClick={toggleMute} style={{
          width: '45px', height: '45px', borderRadius: '50%',
          background: isMuted ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
          border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer'
        }}>
          <i className={isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone'}></i>
        </button>
        
        {callType === 'video' && (
          <button onClick={toggleVideo} style={{
            width: '45px', height: '45px', borderRadius: '50%',
            background: isVideoOff ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
            border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer'
          }}>
            <i className={isVideoOff ? 'fas fa-video-slash' : 'fas fa-video'}></i>
          </button>
        )}
        
        <button onClick={endCallCleanup} style={{
          width: '45px', height: '45px', borderRadius: '50%',
          background: '#ff6b6b', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer'
        }}>
          <i className="fas fa-phone-slash"></i>
        </button>
      </div>
    </div>
  );
};

export default CallModal;