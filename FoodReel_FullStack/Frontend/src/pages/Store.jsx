import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStore, placeOrder } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Store.css';

export default function StorePage() {
  const { partnerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getStore(partnerId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { toast('Failed to load store', 'error'); setLoading(false); });
  }, [partnerId]);

  if (loading) return (
    <div className="store-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
  );
  if (!data) return (
    <div className="empty-state"><div className="icon">🏪</div><h3>Store not found</h3></div>
  );

  const { partner, foods } = data;

  return (
    <div className="store-page">
      {/* Hero */}
      <div className="store-hero">
        <div className="store-hero-bg">
          {foods.length > 0 && <video src={foods[0].video} autoPlay muted loop playsInline className="store-hero-video" />}
          <div className="store-hero-overlay" />
        </div>
        <div className="store-hero-content">
          <button className="store-back" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div className="store-avatar-large">{partner.name?.[0]}</div>
          <h1 className="store-name">{partner.name}</h1>
          <p className="store-address">📍 {partner.address}</p>
          <div className="store-stats">
            <div className="store-stat">
              <span>{partner.totalOrders}</span>
              <label>Delivered</label>
            </div>
            <div className="store-stat-divider" />
            <div className="store-stat">
              <span>{partner.totalItems}</span>
              <label>Items</label>
            </div>
            {partner.phone && (
              <>
                <div className="store-stat-divider" />
                <div className="store-stat">
                  <span style={{ fontSize: 13 }}>{partner.phone}</span>
                  <label>Phone</label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="store-body">
        <h2 className="store-section-title">
          Menu <span className="store-item-count">{foods.length} items</span>
        </h2>

        {foods.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="icon">🍽️</div>
            <h3>Nothing available right now</h3>
          </div>
        ) : (
          <div className="store-grid">
            {foods.map(food => (
              <FoodCard
                key={food._id}
                food={food}
                onOrder={() => setOrderItem(food)}
                onWatch={() => navigate('/feed')}
              />
            ))}
          </div>
        )}
      </div>

      {orderItem && (
        <QuickOrderModal
          food={{ ...orderItem, foodPartner: partner }}
          onClose={() => setOrderItem(null)}
          onSuccess={() => { setOrderItem(null); toast('Order placed! 🎉', 'success'); }}
        />
      )}
    </div>
  );
}

function FoodCard({ food, onOrder, onWatch }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useState(null);

  return (
    <div className="store-food-card">
      <div
        className="store-food-video-wrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onWatch}
      >
        <video
          src={food.video}
          muted
          loop
          playsInline
          ref={el => {
            if (el) { if (hovered) el.play().catch(() => {}); else { el.pause(); el.currentTime = 0; } }
          }}
          className="store-food-video"
        />
        <div className={`store-food-play-btn ${hovered ? 'visible' : ''}`}>
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div className="store-food-badge">{food.category}</div>
      </div>
      <div className="store-food-info">
        <div className="store-food-name-row">
          <h3>{food.name}</h3>
          <span className="store-food-price-tag">₹{food.price}</span>
        </div>
        {food.description && <p className="store-food-desc">{food.description}</p>}
        <div className="store-food-footer">
          <div className="store-food-social">
            {food.likeCount > 0 && <span>❤️ {food.likeCount}</span>}
            {food.commentCount > 0 && <span>💬 {food.commentCount}</span>}
          </div>
          <button className="btn btn-primary btn-sm" onClick={onOrder}>Order</button>
        </div>
      </div>
    </div>
  );
}

function QuickOrderModal({ food, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ quantity: 1, deliveryAddress: '', phoneNumber: '', paymentMethod: 'cod', notes: '' });
  const [placing, setPlacing] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = food.price * form.quantity;

  const submit = async () => {
    if (!form.deliveryAddress.trim() || !form.phoneNumber.trim()) { toast('Fill address and phone', 'error'); return; }
    setPlacing(true);
    try {
      await placeOrder({ foodItemId: food._id, quantity: form.quantity, deliveryAddress: form.deliveryAddress, phoneNumber: form.phoneNumber, paymentMethod: form.paymentMethod, notes: form.notes });
      onSuccess();
    } catch (err) { toast(err.response?.data?.message || 'Order failed', 'error'); }
    finally { setPlacing(false); }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 600 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="quick-order-sheet">
        <div className="qo-header">
          <div>
            <h3>{food.name}</h3>
            <p>{food.foodPartner?.name}</p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="qo-body">
          <div className="qty-row">
            <button className="qty-btn" onClick={() => set('quantity', Math.max(1, form.quantity - 1))}>−</button>
            <span className="qty-val">{form.quantity}</span>
            <button className="qty-btn" onClick={() => set('quantity', form.quantity + 1)}>+</button>
          </div>

          <div className="price-card" style={{ margin: '4px 0' }}>
            <div className="price-line bold"><span>Total</span><span>₹{total}</span></div>
          </div>

          <div className="input-group">
            <label>Delivery Address *</label>
            <input className="input" placeholder="House, Street, City, PIN" value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Phone *</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Payment</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['cod','💵 Cash on Delivery'],['online','💳 Online']].map(([m, label]) => (
                <button key={m} onClick={() => set('paymentMethod', m)}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: `2px solid ${form.paymentMethod === m ? 'var(--accent)' : 'var(--border)'}`, background: form.paymentMethod === m ? 'rgba(255,77,28,0.06)' : 'var(--surface2)', color: form.paymentMethod === m ? 'var(--text)' : 'var(--text2)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label>Notes</label>
            <input className="input" placeholder="Special instructions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="qo-footer">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Total</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>₹{total}</div>
          </div>
          <button className="btn btn-primary" style={{ padding: '13px 28px' }} onClick={submit} disabled={placing}>
            {placing ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
}
