import { useState, useEffect } from 'react';
import { getPartnerFoods, getPartnerOrders, toggleFoodAvailability } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PartnerDashboard.css';

export default function PartnerDashboard() {
  const { partner } = useAuth();
  const toast = useToast();
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPartnerFoods(), getPartnerOrders()])
      .then(([fr, or]) => {
        setFoods(fr.data.foodItems);
        setOrders(or.data.orders);
        setLoading(false);
      })
      .catch(() => { toast('Failed to load dashboard', 'error'); setLoading(false); });
  }, []);

  const handleToggle = async (foodId) => {
    try {
      await toggleFoodAvailability(foodId);
      setFoods(prev => prev.map(f => f._id === foodId ? { ...f, isAvailable: !f.isAvailable } : f));
      toast('Availability updated', 'info');
    } catch { toast('Update failed', 'error'); }
  };

  if (loading) return <div className="page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.finalPrice, 0),
  };

  return (
    <div className="page">
      <div className="page-title">Welcome, {partner?.name}</div>
      <div className="page-subtitle">Here's your restaurant overview</div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: '📦' },
          { label: 'Pending', value: stats.pending, icon: '⏳' },
          { label: 'Delivered', value: stats.delivered, icon: '✅' },
          { label: 'Revenue', value: `₹${stats.revenue}`, icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="stat-card card fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Food Items */}
      <div className="section-header">
        <h2>Your Food Reels</h2>
        <a href="/partner/upload" className="btn btn-primary btn-sm">+ Upload Reel</a>
      </div>
      {foods.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <div className="icon">🎬</div>
          <h3>No reels yet</h3>
          <p>Upload your first food reel to start getting orders.</p>
        </div>
      ) : (
        <div className="food-grid">
          {foods.map(food => (
            <div key={food._id} className="food-item card">
              <div className="food-thumb">
                <video src={food.video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className={`availability-badge ${food.isAvailable ? 'available' : 'unavailable'}`}>
                  {food.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
              <div className="food-details">
                <div>
                  <h4>{food.name}</h4>
                  <p>{food.description}</p>
                  <div className="food-price">₹{food.price}</div>
                </div>
                <button
                  className={`btn btn-sm ${food.isAvailable ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleToggle(food._id)}>
                  {food.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders Preview */}
      <div className="section-header" style={{ marginTop: 40 }}>
        <h2>Recent Orders</h2>
        <a href="/partner/orders" className="btn btn-ghost btn-sm">View All →</a>
      </div>
      {orders.slice(0, 5).map(order => (
        <div key={order._id} className="mini-order card" style={{ marginBottom: 10 }}>
          <div>
            <strong>{order.foodItem?.name}</strong>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{order.user?.fullName} · {order.deliveryAddress}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
            <strong>₹{order.finalPrice}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
