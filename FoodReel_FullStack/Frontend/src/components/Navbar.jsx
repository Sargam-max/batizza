import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logoutUser, logoutPartner } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, partner, role, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { if (role === 'user') await logoutUser(); else await logoutPartner(); } catch {}
    logout();
    toast('Logged out', 'info');
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-icon">🍔</span>
        <span className="logo-text">FoodReel</span>
      </Link>

      <div className="navbar-links">
        {role === 'user' && (
          <>
            <Link to="/feed" className={`nav-link ${location.pathname === '/feed' ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="2" width="8" height="13" rx="2"/><rect x="14" y="9" width="8" height="13" rx="2"/><rect x="2" y="19" width="8" height="3" rx="1"/><rect x="14" y="2" width="8" height="3" rx="1"/></svg>
              Feed
            </Link>
            <Link to="/stores" className={`nav-link ${isActive('/store')}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Stores
            </Link>
            <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Orders
            </Link>
          </>
        )}
        {role === 'partner' && (
          <>
            <Link to="/partner/dashboard" className={`nav-link ${isActive('/partner/dashboard')}`}>Dashboard</Link>
            <Link to="/partner/orders" className={`nav-link ${isActive('/partner/orders')}`}>Orders</Link>
            <Link to="/partner/upload" className={`nav-link ${isActive('/partner/upload')}`}>Upload</Link>
            <Link to="/partner/coupons" className={`nav-link ${isActive('/partner/coupons')}`}>Coupons</Link>
          </>
        )}
      </div>

      <div className="navbar-actions">
        {!role && (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
        {role && (
          <div className="navbar-user">
            <div className="user-avatar">
              {role === 'user' ? user?.fullName?.[0]?.toUpperCase() : partner?.name?.[0]?.toUpperCase()}
            </div>
            <span className="user-name">{role === 'user' ? user?.fullName : partner?.name}</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
