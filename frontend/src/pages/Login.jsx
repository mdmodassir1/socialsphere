import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
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
            <i className="fas fa-globe" style={{ fontSize: '40px', color: 'white' }}></i>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>SocialSphere</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Welcome back! Please login to your account</p>
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
                placeholder="demo@socialsphere.com"
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
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', textDecoration: 'none' }}>Forgot Password?</a>
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
            {loading ? 'Signing in...' : 'Sign In'} <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <span style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.05)', padding: '0 16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>or</span>
        </div>

        {/* Demo Card */}
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center',
          border: '1px solid rgba(78, 205, 196, 0.2)'
        }}>
          <p style={{ color: '#4ecdc4', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
            <i className="fas fa-user-graduate"></i> Demo Account
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>demo@socialsphere.com / demo123</p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Don't have an account?
          <Link to="/register" style={{ color: '#4ecdc4', textDecoration: 'none', fontWeight: '600', marginLeft: '8px' }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;