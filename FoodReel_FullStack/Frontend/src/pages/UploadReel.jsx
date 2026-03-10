import { useState, useRef } from 'react';
import { createFood } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

export default function UploadReel() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'General' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast('Please select a video', 'error'); return; }

    const fd = new FormData();
    fd.append('mama', file);
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);

    setLoading(true);
    setProgress(10);

    try {
      // Fake progress
      const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 800);
      await createFood(fd);
      clearInterval(interval);
      setProgress(100);
      toast('Food reel uploaded! 🎬', 'success');
      setTimeout(() => navigate('/partner/dashboard'), 800);
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-title">Upload Food Reel</div>
      <div className="page-subtitle">Share a video of your dish to attract customers</div>

      <div className="upload-layout">
        {/* Preview */}
        <div className="upload-preview">
          {preview ? (
            <video src={preview} controls className="preview-video" />
          ) : (
            <div className="preview-placeholder" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 48 }}>🎬</div>
              <p>Click to select video</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>MP4, MOV, WebM · Max 100MB</p>
            </div>
          )}
          {preview && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}
              onClick={() => fileRef.current?.click()}>
              Change Video
            </button>
          )}
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="input-group">
            <label>Food Name *</label>
            <input className="input" placeholder="Butter Chicken" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea className="input" rows={3} placeholder="Creamy, aromatic butter chicken with basmati rice..." value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Price (₹) *</label>
              <input className="input" type="number" placeholder="299" min="1" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {['General', 'Biryani', 'Pizza', 'Burgers', 'Chinese', 'South Indian', 'North Indian', 'Desserts', 'Beverages', 'Snacks'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && progress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress < 100 ? 'Uploading...' : '✓ Done!'} {progress}%</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? <span className="spinner" /> : '🚀 Publish Reel'}
          </button>
        </form>
      </div>
    </div>
  );
}
