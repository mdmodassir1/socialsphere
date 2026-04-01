import { useState, useRef, useEffect } from 'react';

const ReactionPicker = ({ onSelect, onClose }) => {
  const pickerRef = useRef(null);

  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Laugh' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😠', label: 'Angry' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        background: '#2d2d3a',
        borderRadius: '40px',
        padding: '8px 12px',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        marginBottom: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {reactions.map(react => (
        <button
          key={react.type}
          onClick={() => onSelect(react.type)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '30px',
            transition: 'all 0.2s',
            color: 'white'
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'scale(1.2)'; e.target.style.background = '#3a3a4a'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.background = 'none'; }}
        >
          {react.emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;