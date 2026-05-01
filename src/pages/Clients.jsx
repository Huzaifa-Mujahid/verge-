import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Download, Loader2, ArrowUpRight, Building2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const STATUS_BADGE = {
  Active:     'badge-emerald',
  Onboarding: 'badge-blue',
  'At Risk':  'badge-amber',
  Churned:    'badge-rose',
};

const AVATAR_BG = ['rgba(99,102,241,0.15)', 'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)', 'rgba(59,130,246,0.15)', 'rgba(244,63,94,0.15)'];
const AVATAR_FG = ['#818cf8', '#34d399', '#fbbf24', '#60a5fa', '#fb7185'];
const av = (name) => { const i = (name?.charCodeAt(0) || 0) % 5; return [AVATAR_BG[i], AVATAR_FG[i]]; };

/* ── Add Client Modal ─────────────────────────────────────────── */
const AddClientModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) { setErr('Name and email are required.'); return; }
    setSaving(true); setErr(null);
    try {
      const { error } = await supabase.from('clients').insert([{ ...form, health_score: 80 }]);
      if (error) throw error;
      onSaved();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Add New Client</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-error"><span>⚠</span><span>{err}</span></div>}
          <form id="add-client-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="label">Full Name *</label><input className="input" value={form.full_name} onChange={e => up('full_name', e.target.value)} placeholder="John Smith" required /></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => up('email', e.target.value)} placeholder="john@company.com" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => up('phone', e.target.value)} placeholder="+1 (555) 000-0000" /></div>
              <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => up('company', e.target.value)} placeholder="Acme Inc." /></div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => up('status', e.target.value)}>
                {['Active', 'Onboarding', 'At Risk', 'Churned'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="add-client-form" type="submit" disabled={saving}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : 'Add Client'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Clients Page ─────────────────────────────────────────────── */
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} in your database</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Download size={15} />Export</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add Client</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name, email, company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select className="input" style={{ paddingRight: 34, minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Active', 'Onboarding', 'At Risk', 'Churned'].map(s => <option key={s}>{s}</option>)}
          </select>
          <Filter size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>Loading clients…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={22} /></div>
            <p className="empty-title">No clients found</p>
            <p className="empty-desc">{search || statusFilter ? 'Try adjusting your search or filter.' : 'Add your first client to get started.'}</p>
            {!search && !statusFilter && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}><Plus size={14} />Add Client</button>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Health Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((client, idx) => {
                    const [abg, afg] = av(client.full_name);
                    const score = client.health_score || 80;
                    const scoreColor = score >= 70 ? 'var(--emerald)' : score >= 40 ? 'var(--amber)' : 'var(--rose)';
                    return (
                      <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                        onClick={() => navigate(`/clients/${client.id}`)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="avatar avatar-md" style={{ background: abg, color: afg }}>
                              {client.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{client.full_name}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                            <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                            {client.company || '—'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[client.status] || 'badge-slate'}`}>
                            <span className="badge-dot" />
                            {client.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className="progress-fill" style={{ width: `${score}%`, background: scoreColor }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{score}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-icon" onClick={e => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>
                            <ArrowUpRight size={15} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <AddClientModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchClients(); }} />}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
