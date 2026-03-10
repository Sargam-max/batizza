import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFoodItems, placeOrder, validateCoupon, getActiveCoupons,
  toggleLike, getBulkLikeStatus, postComment, getComments, deleteComment,
  createRazorpayOrder, verifyRazorpayPayment
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './Feed.css';

// ─── Load Razorpay script once ────────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Feed() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [likedMap, setLikedMap] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [orderModal, setOrderModal] = useState(null);
  const [commentPanel, setCommentPanel] = useState(null);
  const toast = useToast();
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    getFoodItems().then(r => {
      const items = r.data.foodItems;
      setFoods(items);
      setLikeCounts(Object.fromEntries(items.map(f => [f._id, f.likeCount || 0])));
      setLoading(false);
      if (items.length) {
        getBulkLikeStatus(items.map(f => f._id))
          .then(lr => setLikedMap(lr.data.likes))
          .catch(() => {});
      }
    }).catch(() => { toast('Failed to load reels', 'error'); setLoading(false); });
  }, []);

  // Intersection Observer for active reel tracking
  useEffect(() => {
    if (!foods.length) return;
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.index);
          setCurrent(idx);
        }
      });
    }, { threshold: 0.6 });

    cardRefs.current.forEach(el => { if (el) observerRef.current.observe(el); });
    return () => observerRef.current?.disconnect();
  }, [foods]);

  const handleLike = async (foodId) => {
    const wasLiked = likedMap[foodId];
    setLikedMap(m => ({ ...m, [foodId]: !wasLiked }));
    setLikeCounts(m => ({ ...m, [foodId]: (m[foodId] || 0) + (wasLiked ? -1 : 1) }));
    try { await toggleLike(foodId); }
    catch { setLikedMap(m => ({ ...m, [foodId]: wasLiked })); setLikeCounts(m => ({ ...m, [foodId]: (m[foodId] || 0) + (wasLiked ? 1 : -1) })); }
  };

  if (loading) return (
    <div className="feed-loading">
      <div className="feed-loading-inner">
        <div className="loading-reel-skeleton" />
        <div className="loading-reel-skeleton" style={{ opacity: 0.5, transform: 'scale(0.95)' }} />
      </div>
    </div>
  );

  if (!foods.length) return (
    <div className="feed-empty">
      <div className="feed-empty-icon">🍽️</div>
      <h2>No reels yet</h2>
      <p>Food partners haven't uploaded anything. Check back soon!</p>
    </div>
  );

  return (
    <div className="feed-root">
      {/* Sidebar hint */}
      <div className="feed-hint">
        <span>↑ Scroll</span>
      </div>

      <div className="feed-container" ref={containerRef}>
        {foods.map((food, i) => (
          <div
            key={food._id}
            className="reel-wrapper"
            data-index={i}
            ref={el => cardRefs.current[i] = el}
          >
            <ReelCard
              food={food}
              isActive={i === current}
              liked={!!likedMap[food._id]}
              likeCount={likeCounts[food._id] || 0}
              onLike={() => handleLike(food._id)}
              onOrder={() => setOrderModal(food)}
              onComment={() => setCommentPanel(food)}
            />
          </div>
        ))}
      </div>

      {orderModal && (
        <OrderModal
          food={orderModal}
          onClose={() => setOrderModal(null)}
          onSuccess={(msg) => { setOrderModal(null); toast(msg || 'Order placed! 🎉', 'success'); }}
        />
      )}

      {commentPanel && (
        <CommentPanel
          food={commentPanel}
          onClose={() => setCommentPanel(null)}
        />
      )}
    </div>
  );
}

// ─── Reel Card ─────────────────────────────────────────────────────────────────
function ReelCard({ food, isActive, liked, likeCount, onLike, onOrder, onComment }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const lastTap = useRef(0);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setProgress(0);
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(p) ? 0 : p);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTap.current = now;
  };

  const seekTo = (e) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const bar = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - bar.left) / bar.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  return (
    <div className="reel-card">
      {/* Video */}
      <video
        ref={videoRef}
        src={food.video}
        loop muted={muted} playsInline
        className="reel-video"
        onClick={handleDoubleTap}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Double-tap heart */}
      {showHeart && <div className="heart-burst">❤️</div>}

      {/* Pause overlay */}
      {!playing && (
        <button className="play-overlay" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      )}

      {/* Progress bar */}
      <div className="reel-progress-bar" onClick={seekTo}>
        <div className="reel-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Gradient overlays */}
      <div className="reel-gradient-top" />
      <div className="reel-gradient-bottom" />

      {/* Bottom info */}
      <div className="reel-bottom">
        <div className="reel-info">
          <button className="reel-store-link" onClick={() => navigate(`/store/${food.foodPartner?._id}`)}>
            <div className="reel-avatar">{food.foodPartner?.name?.[0] || '?'}</div>
            <span>{food.foodPartner?.name || 'Restaurant'}</span>
          </button>
          <h2 className="reel-title">{food.name}</h2>
          {food.description && <p className="reel-desc">{food.description}</p>}
          <div className="reel-tags">
            <span className="reel-tag price">₹{food.price}</span>
            <span className="reel-tag cat">{food.category}</span>
            {food.isAvailable ? <span className="reel-tag avail">Available</span> : <span className="reel-tag unavail">Unavailable</span>}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="reel-actions">
          <button className={`reel-action-btn ${liked ? 'liked' : ''}`} onClick={onLike}>
            <svg viewBox="0 0 24 24" fill={liked ? '#ff4d1c' : 'none'} stroke={liked ? '#ff4d1c' : 'white'} strokeWidth="2" width="28" height="28">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </button>

          <button className="reel-action-btn" onClick={onComment}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="28" height="28">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{food.commentCount > 0 ? food.commentCount : ''}</span>
          </button>

          <button className="reel-action-btn" onClick={() => setMuted(m => !m)}>
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="26" height="26">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="26" height="26">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>

          <button className="reel-action-btn" onClick={() => navigate(`/store/${food.foodPartner?._id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="26" height="26">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{ fontSize: 10 }}>Store</span>
          </button>
        </div>
      </div>

      {/* Order button */}
      {food.isAvailable && (
        <button className="reel-order-cta" onClick={onOrder}>
          <span>Order Now</span>
          <span className="cta-price">₹{food.price}</span>
        </button>
      )}
    </div>
  );
}

// ─── Comment Panel ─────────────────────────────────────────────────────────────
function CommentPanel({ food, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);

  useEffect(() => {
    getComments(food._id).then(r => { setComments(r.data.comments); setLoading(false); }).catch(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [food._id]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await postComment(food._id, text);
      setComments(c => [res.data.comment, ...c]);
      setText('');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to post', 'error');
    } finally { setPosting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(c => c.filter(cm => cm._id !== commentId));
    } catch { toast('Failed to delete', 'error'); }
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m`;
    if (s < 86400) return `${Math.floor(s/3600)}h`;
    return `${Math.floor(s/86400)}d`;
  };

  return (
    <div className="side-panel-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="side-panel comment-panel">
        <div className="panel-header">
          <h3>Comments <span className="comment-count">{comments.length}</span></h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="comments-list">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <span>💬</span>
              <p>No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c._id} className="comment-item">
                <div className="comment-avatar">{c.user?.fullName?.[0]?.toUpperCase()}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{c.user?.fullName}</strong>
                    <span>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
                {c.user?._id === user?._id && (
                  <button className="comment-delete" onClick={() => handleDelete(c._id)}>✕</button>
                )}
              </div>
            ))
          )}
        </div>

        <form className="comment-input-row" onSubmit={handlePost}>
          <div className="comment-avatar-self">{user?.fullName?.[0]?.toUpperCase()}</div>
          <input
            ref={inputRef}
            className="comment-input"
            placeholder="Add a comment..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={300}
          />
          <button type="submit" className="comment-post-btn" disabled={posting || !text.trim()}>
            {posting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Order Modal with Razorpay ─────────────────────────────────────────────────
function OrderModal({ food, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=details, 2=payment
  const [form, setForm] = useState({ quantity: 1, deliveryAddress: '', phoneNumber: '', couponCode: '', paymentMethod: 'cod', notes: '' });
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = food.price * form.quantity;
  const finalPrice = couponResult ? Math.max(0, total - couponResult.discountAmount) : total;

  const applyCoupon = async () => {
    if (!form.couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await validateCoupon({ couponCode: form.couponCode, orderAmount: total });
      setCouponResult(res.data);
      toast(`✓ Saved ₹${res.data.discountAmount}!`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid coupon', 'error');
      setCouponResult(null);
    } finally { setCouponLoading(false); }
  };

  const loadCoupons = async () => {
    try { const res = await getActiveCoupons(); setCoupons(res.data.coupons); setShowCoupons(true); } catch {}
  };

  const placeAndPay = async () => {
    if (!form.deliveryAddress.trim() || !form.phoneNumber.trim()) {
      toast('Please fill delivery address and phone', 'error'); return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder({
        foodItemId: food._id,
        quantity: form.quantity,
        deliveryAddress: form.deliveryAddress,
        phoneNumber: form.phoneNumber,
        couponCode: couponResult ? form.couponCode : undefined,
        paymentMethod: form.paymentMethod,
        notes: form.notes
      });

      const order = res.data.order;
      setPlacedOrder(order);

      if (form.paymentMethod === 'cod') {
        onSuccess('Order placed! Pay on delivery 💵');
        return;
      }

      // Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast('Payment gateway failed to load. Please try COD.', 'error'); setPlacing(false); return; }

      const rzpRes = await createRazorpayOrder({ orderId: order._id });
      const rzp = rzpRes.data;

      const options = {
        key: rzp.key,
        amount: rzp.amount,
        currency: rzp.currency,
        name: 'FoodReel',
        description: `Order for ${food.name}`,
        order_id: rzp.razorpayOrderId,
        prefill: { name: rzp.prefill?.name || user?.fullName, email: rzp.prefill?.email || user?.email },
        theme: { color: '#ff4d1c' },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id
            });
            onSuccess('Payment successful! Order confirmed 🎉');
          } catch {
            toast('Payment verification failed. Contact support.', 'error');
            onClose();
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. Your order is saved — pay later from orders.', 'info');
            onClose();
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      toast(err.response?.data?.message || 'Order failed', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="order-modal">
        {/* Food preview header */}
        <div className="order-modal-hero">
          <video src={food.video} autoPlay muted loop playsInline className="order-modal-video" />
          <div className="order-modal-hero-overlay">
            <h2>{food.name}</h2>
            <p>{food.foodPartner?.name}</p>
          </div>
          <button className="order-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="order-modal-body">
          {/* Qty */}
          <div className="order-field">
            <label>Quantity</label>
            <div className="qty-row">
              <button className="qty-btn" onClick={() => set('quantity', Math.max(1, form.quantity - 1))}>−</button>
              <span className="qty-val">{form.quantity}</span>
              <button className="qty-btn" onClick={() => set('quantity', form.quantity + 1)}>+</button>
            </div>
          </div>

          {/* Price card */}
          <div className="price-card">
            <div className="price-line"><span>₹{food.price} × {form.quantity}</span><span>₹{total}</span></div>
            {couponResult && <div className="price-line green"><span>🏷️ {form.couponCode}</span><span>−₹{couponResult.discountAmount}</span></div>}
            <div className="price-line bold"><span>Total</span><span>₹{finalPrice}</span></div>
          </div>

          {/* Coupon */}
          <div className="order-field">
            <label>Coupon</label>
            <div className="coupon-row">
              <input className="input" placeholder="Enter code" value={form.couponCode}
                onChange={e => { set('couponCode', e.target.value.toUpperCase()); setCouponResult(null); }} />
              <button className="btn btn-secondary btn-sm" onClick={applyCoupon} disabled={couponLoading || !form.couponCode}>
                {couponLoading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Apply'}
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 0' }} onClick={loadCoupons}>
              🏷️ Browse available coupons
            </button>
            {showCoupons && coupons.length > 0 && (
              <div className="coupon-chips">
                {coupons.map(c => (
                  <button key={c._id} className="coupon-chip"
                    onClick={() => { set('couponCode', c.code); setCouponResult(null); setShowCoupons(false); }}>
                    <strong>{c.code}</strong>
                    <span>{c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="order-field">
            <label>Delivery Address *</label>
            <input className="input" placeholder="House no., Street, City, PIN" value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} />
          </div>

          <div className="order-field">
            <label>Phone Number *</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
          </div>

          <div className="order-field">
            <label>Payment Method</label>
            <div className="pay-methods">
              <button className={`pay-method-btn ${form.paymentMethod === 'cod' ? 'active' : ''}`} onClick={() => set('paymentMethod', 'cod')}>
                <span className="pay-icon">💵</span>
                <span>Cash on Delivery</span>
              </button>
              <button className={`pay-method-btn ${form.paymentMethod === 'online' ? 'active' : ''}`} onClick={() => set('paymentMethod', 'online')}>
                <span className="pay-icon">💳</span>
                <div>
                  <span>Pay Online</span>
                  <span className="pay-sub">UPI · Cards · Wallets</span>
                </div>
              </button>
            </div>
            {form.paymentMethod === 'online' && (
              <div className="razorpay-badge">
                <span>🔒 Secured by</span>
                <strong>Razorpay</strong>
              </div>
            )}
          </div>

          <div className="order-field">
            <label>Notes <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" placeholder="Extra spicy, no onions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="order-modal-footer">
          <div className="footer-price">
            <div className="footer-price-label">Total</div>
            <div className="footer-price-val">₹{finalPrice}</div>
          </div>
          <button className="btn btn-primary order-place-btn" onClick={placeAndPay} disabled={placing}>
            {placing ? <div className="spinner" style={{ width: 18, height: 18 }} /> :
              form.paymentMethod === 'cod' ? 'Place Order →' : 'Pay ₹' + finalPrice + ' →'}
          </button>
        </div>
      </div>
    </div>
  );
}
