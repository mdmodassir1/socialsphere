import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 4) return 1;
    if (password.length < 8) return 2;
    return 3;
  };

  const strength = getStrength();
  const strengthText = ['', 'Weak', 'Medium', 'Strong'];
  const strengthColor = ['', '#ff6b6b', '#ffe66d', '#4ecdc4'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
            borderRadius: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <i className="fas fa-users" style={{ fontSize: '40px', color: 'white' }}></i>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>Join Us</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Create your free account and start connecting</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.15)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '16px'
              }}></i>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-envelope" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '16px'
              }}></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '16px'
              }}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ height: '4px', flex: 1, background: strength >= 1 ? strengthColor[strength] : 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                  <div style={{ height: '4px', flex: 1, background: strength >= 2 ? strengthColor[strength] : 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                  <div style={{ height: '4px', flex: 1, background: strength >= 3 ? strengthColor[strength] : 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                </div>
                <span style={{ fontSize: '10px', color: strengthColor[strength] || 'rgba(255,255,255,0.5)' }}>{strengthText[strength]} password</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: '24px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'} <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <span style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.05)', padding: '0 16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>or</span>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Already have an account?
          <Link to="/login" style={{ color: '#4ecdc4', textDecoration: 'none', fontWeight: '600', marginLeft: '8px' }}>Sign In</Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '20px' }}>
          By signing up, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Register;