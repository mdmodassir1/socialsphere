import { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onSend, onCancel, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioURL(null);
    setRecordingTime(0);
    onCancel();
  };

  const sendRecording = async () => {
    if (audioURL) {
      const audioBlob = await fetch(audioURL).then(r => r.blob());
      onSend(audioBlob, 'voice_note', recordingTime);
      setAudioURL(null);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
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
      {!audioURL && !isRecording && (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          disabled={disabled}
          style={{
            background: '#ff6b6b',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="fas fa-microphone" style={{ fontSize: '18px' }}></i>
        </button>
      )}

      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
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

      {audioURL && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
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
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
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

export default VoiceRecorder;