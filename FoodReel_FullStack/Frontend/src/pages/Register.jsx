import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerUser, registerPartner } from '../services/api';
import './Auth.css';

export default function Register() {
  const [params] = useSearchParams();
  const [type, setType] = useState(params.get('type') === 'partner' ? 'partner' : 'user');
  const [loading, setLoading] = useState(false);
  const { loginAsUser, loginAsPartner } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    name: '', contactName: '', phone: '', address: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'user') {
        const res = await registerUser({ fullName: form.fullName, email: form.email, password: form.password });
        loginAsUser(res.data.user);
        toast('Account created! Welcome 🎉', 'success');
        navigate('/feed');
      } else {
        const res = await registerPartner({
          name: form.name, contactName: form.contactName,
          email: form.email, password: form.password,
          phone: form.phone, address: form.address
        });
        loginAsPartner(res.data.foodPartner);
        toast('Partner account created! 🍕', 'success');
        navigate('/partner/dashboard');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-header">
          <h1>Create account</h1>
          <p>Join FoodReel and start exploring</p>
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
          {type === 'user' ? (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" placeholder="John Doe" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label>Restaurant Name</label>
                <input className="input" placeholder="Spice Garden" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Contact Person</label>
                <input className="input" placeholder="Ramesh Kumar" value={form.contactName} onChange={e => set('contactName', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Email</label>
                  <input className="input" type="email" placeholder="restaurant@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <label>Address</label>
                <input className="input" placeholder="123 MG Road, Bangalore" value={form.address} onChange={e => set('address', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
