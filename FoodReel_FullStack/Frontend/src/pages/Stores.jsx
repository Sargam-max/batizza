import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStores } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getAllStores()
      .then(r => { setStores(r.data.stores); setLoading(false); })
      .catch(() => { toast('Failed to load stores', 'error'); setLoading(false); });
  }, []);

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-title">Explore Stores</div>
      <div className="page-subtitle">Discover restaurants and food partners near you</div>

      <div style={{ marginBottom: 24, maxWidth: 400 }}>
        <input
          className="input"
          placeholder="🔍 Search by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <div className="icon">🏪</div>
          <h3>No stores found</h3>
          <p>{search ? 'Try a different search term.' : 'No food partners have joined yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(store => (
            <button
              key={store._id}
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
              onClick={() => navigate(`/store/${store._id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'var(--font-head)', flexShrink: 0 }}>
                  {store.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {store.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {store.address}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{store.itemCount}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Items</span>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, alignSelf: 'center' }}>View Store →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
