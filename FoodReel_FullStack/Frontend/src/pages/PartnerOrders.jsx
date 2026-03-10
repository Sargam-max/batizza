import { useState, useEffect } from 'react';
import { getPartnerOrders, updateOrderStatus } from '../services/api';
import { useToast } from '../context/ToastContext';

const STATUSES = ['', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};
const STATUS_LABELS = {
  '': 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function PartnerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = (status) => {
    setLoading(true);
    getPartnerOrders(status)
      .then(r => { setOrders(r.data.orders); setLoading(false); })
      .catch(() => { toast('Failed to load orders', 'error'); setLoading(false); });
  };

  useEffect(() => load(filter), [filter]);

  const handleStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast(`Order marked as ${STATUS_LABELS[status]}`, 'success');
      load(filter);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-title">Incoming Orders</div>
      <div className="page-subtitle">Manage and update order statuses</div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <div className="icon">📭</div>
          <h3>No orders here</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map(order => (
            <div key={order._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 4 }}>
                    {order.foodItem?.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                    👤 {order.user?.fullName} · 📞 {order.phoneNumber}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>📍 {order.deliveryAddress}</p>
                  {order.notes && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>📝 {order.notes}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                  <span className={`badge badge-${order.paymentStatus}`}>{order.paymentStatus}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                  <span>Qty: <strong>{order.quantity}</strong></span>
                  {order.couponApplied && <span style={{ color: 'var(--success)' }}>🏷️ {order.couponApplied}</span>}
                  <span>
                    {order.discountAmount > 0 && <del style={{ color: 'var(--text3)', marginRight: 6 }}>₹{order.originalPrice}</del>}
                    <strong style={{ fontFamily: 'var(--font-head)', fontSize: 17 }}>₹{order.finalPrice}</strong>
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {order.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {NEXT_STATUS[order.status] && (
                    <button className="btn btn-primary btn-sm"
                      onClick={() => handleStatus(order._id, NEXT_STATUS[order.status])}>
                      Mark as {STATUS_LABELS[NEXT_STATUS[order.status]]}
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button className="btn btn-danger btn-sm"
                      onClick={() => handleStatus(order._id, 'cancelled')}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
