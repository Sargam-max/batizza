import { useState, useEffect } from 'react';
import { getUserOrders, cancelOrder } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Orders.css';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    getUserOrders()
      .then(r => { setOrders(r.data.orders); setLoading(false); })
      .catch(() => { toast('Failed to load orders', 'error'); setLoading(false); });
  };

  useEffect(load, []);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      toast('Order cancelled', 'info');
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Cannot cancel order', 'error');
    }
  };

  if (loading) return <div className="page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  if (!orders.length) return (
    <div className="empty-state" style={{ height: 'calc(100vh - 62px)' }}>
      <div className="icon">🛒</div>
      <h3>No orders yet</h3>
      <p>Start browsing food reels and place your first order!</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-title">My Orders</div>
      <div className="page-subtitle">{orders.length} orders found</div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order._id} className="order-card card fade-up">
            <div className="order-top">
              <div className="order-info">
                <h3>{order.foodItem?.name}</h3>
                <p className="order-partner">{order.foodPartner?.name}</p>
                <p className="order-address">📍 {order.deliveryAddress}</p>
              </div>
              <div className="order-meta">
                <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                <span className={`badge badge-${order.paymentStatus}`} style={{ marginTop: 6 }}>
                  {order.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'} · {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {order.status !== 'cancelled' && (
              <div className="status-track">
                {STATUS_STEPS.map((step, i) => {
                  const idx = STATUS_STEPS.indexOf(order.status);
                  return (
                    <div key={step} className={`track-step ${i <= idx ? 'done' : ''}`}>
                      <div className="track-dot" />
                      {i < STATUS_STEPS.length - 1 && <div className="track-line" />}
                      <span>{STATUS_LABELS[step]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="order-bottom">
              <div className="order-pricing">
                <span>Qty: {order.quantity}</span>
                {order.couponApplied && <span className="coupon-tag">🏷️ {order.couponApplied} saved ₹{order.discountAmount}</span>}
                <span className="order-total">₹{order.finalPrice}</span>
              </div>
              <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              {['pending', 'confirmed'].includes(order.status) && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order._id)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
