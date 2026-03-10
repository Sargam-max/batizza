import { useState } from 'react';
import { createCoupon, getActiveCoupons } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

export default function PartnerCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    maxDiscount: '', minOrderAmount: '', usageLimit: '', expiresAt: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    getActiveCoupons()
      .then(r => { setCoupons(r.data.coupons); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      });
      setCoupons(p => [res.data.coupon, ...p]);
      setForm({ code: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minOrderAmount: '', usageLimit: '', expiresAt: '' });
      toast('Coupon created! 🏷️', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create coupon', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-title">Coupons</div>
      <div className="page-subtitle">Create discount coupons for your customers</div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Create Form */}
        <form onSubmit={handleCreate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>New Coupon</h3>

          <div className="input-group">
            <label>Coupon Code *</label>
            <input className="input" placeholder="SAVE20" value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())} required />
          </div>

          <div className="input-group">
            <label>Discount Type *</label>
            <select className="input" value={form.discountType} onChange={e => set('discountType', e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="input-group">
              <label>Discount Value *</label>
              <input className="input" type="number" placeholder={form.discountType === 'percentage' ? '20' : '50'}
                value={form.discountValue} onChange={e => set('discountValue', e.target.value)} required min="1" />
            </div>
            {form.discountType === 'percentage' && (
              <div className="input-group">
                <label>Max Discount (₹)</label>
                <input className="input" type="number" placeholder="100" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} min="0" />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="input-group">
              <label>Min Order (₹)</label>
              <input className="input" type="number" placeholder="200" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} min="0" />
            </div>
            <div className="input-group">
              <label>Usage Limit</label>
              <input className="input" type="number" placeholder="100" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} min="1" />
            </div>
          </div>

          <div className="input-group">
            <label>Expiry Date</label>
            <input className="input" type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Create Coupon'}
          </button>
        </form>

        {/* Coupons list */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Active Coupons ({coupons.length})
          </h3>
          {loading ? <div className="spinner" style={{ width: 28, height: 28 }} /> :
            coupons.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="icon">🏷️</div>
                <h3>No coupons yet</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coupons.map(c => (
                  <div key={c._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <strong style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: 'var(--accent)', letterSpacing: 1 }}>{c.code}</strong>
                        <span className="badge badge-confirmed">Active</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 16 }}>
                        <span>{c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} flat off`}</span>
                        {c.maxDiscount && <span>Max: ₹{c.maxDiscount}</span>}
                        {c.minOrderAmount > 0 && <span>Min: ₹{c.minOrderAmount}</span>}
                        {c.usageLimit && <span>Limit: {c.usageLimit}</span>}
                        {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
