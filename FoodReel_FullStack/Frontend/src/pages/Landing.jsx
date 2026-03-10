import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { role } = useAuth();

  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="grain" />
      </div>

      <div className="landing-hero fade-up">
        <div className="hero-tag">🔥 Discover food through video</div>
        <h1 className="hero-title">
          Watch. Crave.<br />
          <span className="accent-text">Order.</span>
        </h1>
        <p className="hero-sub">
          FoodReel brings food discovery to life. Watch mouth-watering food reels,
          discover local restaurants, and order in seconds — all with sweet coupon deals.
        </p>

        {!role && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px' }}>
              Sign In
            </Link>
          </div>
        )}
        {role === 'user' && (
          <Link to="/feed" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Browse Food Reels →
          </Link>
        )}
        {role === 'partner' && (
          <Link to="/partner/dashboard" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Go to Dashboard →
          </Link>
        )}
      </div>

      <div className="features">
        {[
          { icon: '🎬', title: 'Food Reels', desc: 'Discover food through short videos uploaded by local restaurants.' },
          { icon: '🏷️', title: 'Coupon Deals', desc: 'Apply promo codes for flat or percentage discounts on every order.' },
          { icon: '⚡', title: 'Fast Ordering', desc: 'Tap to order directly from the reel. Pay online or cash on delivery.' },
          { icon: '📦', title: 'Live Tracking', desc: 'Track your order status from confirmed to delivered in real-time.' },
        ].map((f, i) => (
          <div className="feature-card fade-up" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="landing-cta">
        <h2>Are you a restaurant?</h2>
        <p>Upload food reels, manage orders, and create exclusive coupon deals for your customers.</p>
        <Link to="/register?type=partner" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Join as Food Partner →
        </Link>
      </div>
    </div>
  );
}
