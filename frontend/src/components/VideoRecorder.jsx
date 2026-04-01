import { useState, useRef, useEffect } from 'react';

const VideoRecorder = ({ onSend, onCancel, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoURL, setVideoURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) videoRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      videoChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoURL(url);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting video recording:', error);
      alert('Could not access camera');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setVideoURL(null);
    setRecordingTime(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  const sendRecording = async () => {
    if (videoURL) {
      const videoBlob = await fetch(videoURL).then(r => r.blob());
      onSend(videoBlob, 'video_note', recordingTime);
      setVideoURL(null);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (previewVideoRef.current) {
      if (isPlaying) {
        previewVideoRef.current.pause();
      } else {
        previewVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div style={{
      padding: '8px 12px',
      background: '#2d2d3a',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    }}>
      {!videoURL && !isRecording && (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          disabled={disabled}
          style={{
            background: '#4ecdc4',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            color: '#1e1e2e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="fas fa-video" style={{ fontSize: '18px' }}></i>
        </button>
      )}

      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{
              width: '60px',
              height: '80px',
              borderRadius: '8px',
              background: '#000',
              objectFit: 'cover'
            }}
          />
          <div style={{
            width: '12px',
            height: '12px',
            background: '#ff6b6b',
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ color: 'white', fontSize: '14px' }}>
            Recording... {formatTime(recordingTime)}
          </span>
          <button
            onClick={stopRecording}
            style={{
              background: '#ff6b6b',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-stop"></i>
          </button>
        </div>
      )}

      {videoURL && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
          <video
            ref={previewVideoRef}
            src={videoURL}
            style={{
              width: '60px',
              height: '80px',
              borderRadius: '8px',
              background: '#000',
              objectFit: 'cover'
            }}
          />
          <button
            onClick={togglePlayback}
            style={{
              background: '#4ecdc4',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: '#1e1e2e',
              cursor: 'pointer'
            }}
          >
            <i className={isPlaying ? 'fas fa-pause' : 'fas fa-play'}></i>
          </button>
          <span style={{ color: 'white', fontSize: '12px' }}>
            {formatTime(recordingTime)}
          </span>
          <button
            onClick={sendRecording}
            style={{
              background: '#4ecdc4',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              color: '#1e1e2e',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
          <button
            onClick={cancelRecording}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;