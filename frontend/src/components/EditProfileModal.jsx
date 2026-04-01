import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const { data } = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(data);
      if (onUpdate) onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(30,30,46,0.95)',
        borderRadius: '24px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ color: 'white', marginBottom: '24px' }}>Edit Profile</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              margin: '0 auto',
              overflow: 'hidden',
              border: '3px solid #4ecdc4',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('avatar-input').click()}
            >
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=4ecdc4&color=fff&size=100`}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px' }}>
              Click to change avatar
            </p>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px'
              }}
              required
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'white',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
              placeholder="Tell something about yourself..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;