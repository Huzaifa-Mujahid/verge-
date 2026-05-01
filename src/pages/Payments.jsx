import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Clock, Calendar, X, Loader2, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EMPTY_FORM = { project_id: '', amount: '', due_date: '', is_paid: false };

const PaymentModal = ({ form, setForm, projects, saving, err, onSave, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="modal-box">
      <div className="modal-header">
        <span className="modal-title">Log Payment</span>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="modal-body">
        {err && <div className="alert alert-error"><span>⚠</span><span>{err}</span></div>}
        <form id="pay-form" onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Project *</label>
            <select className="input" required value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Amount ($) *</label>
              <input className="input" type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', marginTop: 8 }}>
            <input type="checkbox" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} style={{ marginTop: 2, width: 16, height: 16 }} />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Mark as Paid</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Record this as an immediate collection.</p>
            </div>
          </label>
        </form>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="pay-form" type="submit" disabled={saving}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Log Payment'}
        </button>
      </div>
    </motion.div>
  </div>
);

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [stats, setStats] = useState({ totalDue: 0, totalPaid: 0, overdue: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { data: prData }] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, title'),
      ]);
      const map = (prData || []).reduce((a, p) => ({ ...a, [p.id]: p.title }), {});
      
      let totalDue = 0, totalPaid = 0, overdue = 0;
      const now = new Date();

      const enriched = (pData || []).map(p => {
        const isOverdue = !p.is_paid && p.due_date && new Date(p.due_date) < now;
        const amt = p.amount || 0;
        if (p.is_paid) totalPaid += amt;
        else {
          totalDue += amt;
          if (isOverdue) overdue += amt;
        }
        return { ...p, project_title: map[p.project_id] || 'Unknown', is_overdue: isOverdue };
      });

      setPayments(enriched);
      setProjects(prData || []);
      setStats({ totalDue, totalPaid, overdue });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.amount) { setFormErr('Project and amount are required.'); return; }
    setSaving(true); setFormErr(null);
    try {
      const payload = { project_id: form.project_id, amount: parseFloat(form.amount), due_date: form.due_date || null, is_paid: form.is_paid, payment_date: form.is_paid ? new Date().toISOString() : null };
      const { error } = await supabase.from('payments').insert([payload]);
      if (error) throw error;
      setShowModal(false); fetchData();
    } catch (e) { setFormErr(e.message); } finally { setSaving(false); }
  };

  const markAsPaid = async (p, e) => {
    e.stopPropagation();
    try {
      await supabase.from('payments').update({ is_paid: true, payment_date: new Date().toISOString() }).eq('id', p.id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr(null); setShowModal(true); };

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track invoices and collections</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />Log Payment</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Outstanding', value: stats.totalDue, icon: Clock, c: 'indigo' },
          { label: 'Total Revenue', value: stats.totalPaid, icon: TrendingUp, c: 'emerald' },
          { label: 'Overdue Amount', value: stats.overdue, icon: TrendingDown, c: 'rose' }
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              <s.icon size={16} style={{ color: `var(--${s.c})` }} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>${(s.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </motion.div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" /><p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>Loading payments…</p></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><DollarSign size={22} /></div>
            <p className="empty-title">No transactions recorded</p>
            <p className="empty-desc">Log your first payment to start tracking revenue.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}><Plus size={14} />Log Payment</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Project / Ref</th><th>Amount</th><th>Due Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ background: p.is_overdue ? 'rgba(244,63,94,0.03)' : undefined }}>
                    <td>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.project_title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>INV-{p.id.slice(0, 8).toUpperCase()}</p>
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>${(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: p.is_overdue ? 'var(--rose)' : 'var(--text-secondary)' }}>
                          {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.is_paid ? 'badge-emerald' : p.is_overdue ? 'badge-rose' : 'badge-amber'}`}>
                        {p.is_paid ? '✓ Paid' : p.is_overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!p.is_paid ? (
                        <button className="btn btn-sm" style={{ background: 'var(--emerald-glow)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)' }} onClick={e => markAsPaid(p, e)}>
                          Mark Paid
                        </button>
                      ) : (
                        <CheckCircle2 size={18} style={{ color: 'var(--emerald)', opacity: 0.5, display: 'inline-block', marginRight: 8 }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <PaymentModal form={form} setForm={setForm} projects={projects} saving={saving} err={formErr} onSave={handleSave} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Payments;
