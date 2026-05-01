import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, Clock, DollarSign,
  TrendingUp, Calendar, MessageSquare, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const TTStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' };

const StatCard = ({ icon: Icon, label, value, color = 'indigo', onClick }) => {
  const C = { indigo: ['rgba(99,102,241,0.1)', '#818cf8'], emerald: ['rgba(16,185,129,0.1)', '#34d399'], amber: ['rgba(245,158,11,0.1)', '#fbbf24'], rose: ['rgba(244,63,94,0.1)', '#fb7185'], blue: ['rgba(59,130,246,0.1)', '#60a5fa'] };
  const [bg, fg] = C[color] || C.indigo;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg }}>
          <Icon size={17} />
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 3 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
};

const QuickAction = ({ icon: Icon, label, desc, path, color = 'indigo' }) => {
  const nav = useNavigate();
  const C = { indigo: ['rgba(99,102,241,0.1)', '#818cf8'], emerald: ['rgba(16,185,129,0.1)', '#34d399'], amber: ['rgba(245,158,11,0.1)', '#fbbf24'], blue: ['rgba(59,130,246,0.1)', '#60a5fa'] };
  const [bg, fg] = C[color] || C.indigo;
  return (
    <button onClick={() => nav(path)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, projects: 0, revenue: 0, overdue: 0 });
  const [projData, setProjData] = useState([]);
  const [revChartData, setRevChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const nowStr = new Date().toISOString();
      const [{ count: c }, { count: p }, { data: revData }, { data: projRows }, { count: overdueCount }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, payment_date').eq('is_paid', true),
        supabase.from('projects').select('status'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('is_paid', false).lt('due_date', nowStr)
      ]);
      const revenue = revData?.reduce((s, x) => s + (x.amount || 0), 0) || 0;
      const counts = { Pending: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
      projRows?.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
      setProjData([
        { name: 'Pending', value: counts['Pending'], color: '#f59e0b' },
        { name: 'In Progress', value: counts['In Progress'], color: '#6366f1' },
        { name: 'Completed', value: counts['Completed'], color: '#10b981' },
        { name: 'Cancelled', value: counts['Cancelled'], color: '#f43f5e' },
      ]);
      setStats({ clients: c || 0, projects: p || 0, revenue, overdue: overdueCount || 0 });

      // Build real revenue chart data for last 6 months
      const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const curMonth = new Date().getMonth();
      const chartMap = {};
      for (let i = 5; i >= 0; i--) {
        let m = curMonth - i;
        if (m < 0) m += 12;
        chartMap[monthsStr[m]] = 0;
      }

      revData?.forEach(r => {
        if (r.payment_date) {
          const mName = monthsStr[new Date(r.payment_date).getMonth()];
          if (chartMap[mName] !== undefined) chartMap[mName] += (r.amount || 0);
        }
      });
      setRevChartData(Object.keys(chartMap).map(k => ({ month: k, revenue: chartMap[k] })));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your business performance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon={Users}      label="Total Clients"   value={stats.clients}      color="indigo"  onClick={() => navigate('/clients')} />
        <StatCard icon={Briefcase}  label="Active Projects" value={stats.projects}     color="blue"    onClick={() => navigate('/projects')} />
        <StatCard icon={DollarSign} label="Total Revenue"   value={fmt(stats.revenue)} color="emerald" onClick={() => navigate('/payments')} />
        <StatCard icon={Clock}      label="Overdue Items"   value={stats.overdue}      color="rose"    onClick={() => navigate('/payments')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }} className="dash-grid">
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <p className="section-title">Revenue Overview</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Real collected revenue over last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />Revenue
              </span>
            </div>
          </div>
          <div style={{ height: 240 }}>
            {revChartData.reduce((s, x) => s + x.revenue, 0) === 0 ? (
              <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                 <p className="empty-desc">No revenue collected in the last 6 months.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TTStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rg)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <p className="section-title" style={{ marginBottom: 18 }}>Project Status</p>
          <div style={{ height: 170, marginBottom: 14 }}>
            {projData.reduce((s, x) => s + x.value, 0) === 0 ? (
               <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                 <p className="empty-desc">No active projects.</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={TTStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#6366f1"
                    label={false}
                    cell={(entry) => <rect fill={entry.color} />}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <hr className="divider" style={{ marginBottom: 14 }} />
          {projData.map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <p className="section-title" style={{ marginBottom: 14 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <QuickAction icon={Users}         label="Manage Clients"      desc="View and edit your client database"   path="/clients"      color="indigo" />
          <QuickAction icon={Briefcase}     label="Manage Projects"     desc="Track project status and budgets"     path="/projects"     color="blue" />
          <QuickAction icon={Calendar}      label="Schedule Meeting"    desc="Book and manage appointments"         path="/meetings"     color="emerald" />
          <QuickAction icon={MessageSquare} label="Log Interaction"     desc="Record client communications"         path="/interactions" color="amber" />
        </div>
      </div>

      <style>{`@media(max-width:900px){.dash-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
};

export default Dashboard;
