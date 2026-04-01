import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { settings, pushEnabled, updateSettings } = useNotification();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localPushEnabled, setLocalPushEnabled] = useState(pushEnabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      ...localSettings,
      pushEnabled: localPushEnabled
    });
    setSaving(false);
    onClose();
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
        background: '#1e1e2e',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          background: '#2d2d3a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>Notification Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', cursor: 'pointer' }}>
              <span>Enable Push Notifications</span>
              <input
                type="checkbox"
                checked={localPushEnabled}
                onChange={(e) => setLocalPushEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#4ecdc4', marginBottom: '15px' }}>Notification Types</h4>
            
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>📨 Messages</span>
              <input
                type="checkbox"
                checked={localSettings.messages}
                onChange={(e) => setLocalSettings({ ...localSettings, messages: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>❤️ Likes</span>
              <input
                type="checkbox"
                checked={localSettings.likes}
                onChange={(e) => setLocalSettings({ ...localSettings, likes: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>💬 Comments</span>
              <input
                type="checkbox"
                checked={localSettings.comments}
                onChange={(e) => setLocalSettings({ ...localSettings, comments: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>👥 Follows</span>
              <input
                type="checkbox"
                checked={localSettings.follows}
                onChange={(e) => setLocalSettings({ ...localSettings, follows: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>📸 Story Replies</span>
              <input
                type="checkbox"
                checked={localSettings.storyReplies}
                onChange={(e) => setLocalSettings({ ...localSettings, storyReplies: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '12px', cursor: 'pointer' }}>
              <span>📞 Missed Calls</span>
              <input
                type="checkbox"
                checked={localSettings.calls}
                onChange={(e) => setLocalSettings({ ...localSettings, calls: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4ecdc4',
              border: 'none',
              borderRadius: '12px',
              color: '#1e1e2e',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;