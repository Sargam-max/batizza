import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { loginUser, loginPartner } from '../services/api';
import './Auth.css';

export default function Login() {
  const [type, setType] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsUser, loginAsPartner } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'user') {
        const res = await loginUser({ email, password });
        loginAsUser(res.data.user);
        toast('Welcome back! 👋', 'success');
        navigate('/feed');
      } else {
        const res = await loginPartner({ email, password });
        loginAsPartner(res.data.foodPartner);
        toast('Welcome back, partner! 🍕', 'success');
        navigate('/partner/dashboard');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your FoodReel account</p>
        </div>

        <div className="type-toggle">
          <button className={`toggle-btn ${type === 'user' ? 'active' : ''}`} onClick={() => setType('user')}>
            👤 Customer
          </button>
          <button className={`toggle-btn ${type === 'partner' ? 'active' : ''}`} onClick={() => setType('partner')}>
            🍕 Food Partner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
