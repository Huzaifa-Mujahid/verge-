import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, Briefcase, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabase';

const TTStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' };

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ revenue: [], projects: [], clients: [], totalRev: 0, activeValue: 0, totalClients: 0 });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [payRes, projRes, clientRes] = await Promise.all([
        supabase.from('payments').select('amount, payment_date, is_paid'),
        supabase.from('projects').select('id, budget, created_at, status'),
        supabase.from('clients').select('id, created_at')
      ]);

      const payments = payRes.data || [];
      const projects = projRes.data || [];
      const clients = clientRes.data || [];

      // Calculate totals
      const totalRev = payments.filter(p => p.is_paid).reduce((s, p) => s + (p.amount || 0), 0);
      const activeValue = projects.filter(p => p.status === 'In Progress' || p.status === 'Pending').reduce((s, p) => s + (p.budget || 0), 0);
      const totalClients = clients.length;

      // Grouping helper for last 8 months
      const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const curMonth = new Date().getMonth();
      
      const getBaseMap = () => {
        const map = {};
        for (let i = 7; i >= 0; i--) {
          let m = curMonth - i;
          if (m < 0) m += 12;
          map[monthsStr[m]] = 0;
        }
        return map;
      };

      const revMap = getBaseMap();
      payments.forEach(p => {
        if (p.is_paid && p.payment_date) {
          const m = monthsStr[new Date(p.payment_date).getMonth()];
          if (revMap[m] !== undefined) revMap[m] += (p.amount || 0);
        }
      });
      const revData = Object.keys(revMap).map(k => ({ name: k, revenue: revMap[k] }));

      const projMap = getBaseMap();
      projects.forEach(p => {
        if (p.created_at) {
          const m = monthsStr[new Date(p.created_at).getMonth()];
          if (projMap[m] !== undefined) projMap[m] += 1;
        }
      });
      const projData = Object.keys(projMap).map(k => ({ name: k, projects: projMap[k] }));

      const clientMap = getBaseMap();
      let cumulativeClients = 0;
      
      // Calculate clients created before the 8-month window
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 7);
      eightMonthsAgo.setDate(1);
      
      clients.forEach(c => {
        if (c.created_at) {
          const d = new Date(c.created_at);
          if (d < eightMonthsAgo) {
            cumulativeClients++;
          } else {
            const m = monthsStr[d.getMonth()];
            if (clientMap[m] !== undefined) clientMap[m] += 1;
          }
        }
      });

      const clientData = Object.keys(clientMap).map(k => {
         cumulativeClients += clientMap[k];
         return { name: k, clients: cumulativeClients };
      });

      setData({ revenue: revData, projects: projData, clients: clientData, totalRev, activeValue, totalClients });
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ label, value, icon: Icon, c }) => {
    const C = { emerald: ['rgba(16,185,129,0.1)', '#34d399'], indigo: ['rgba(99,102,241,0.1)', '#818cf8'], blue: ['rgba(59,130,246,0.1)', '#60a5fa'] };
    const [bg, fg] = C[c] || C.emerald;
    return (
      <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: bg, filter: 'blur(40px)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} />
          </div>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Intelligence Reports</h1>
          <p className="page-subtitle">Strategic business analytics and forecasting</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: 400 }}><div className="spinner" /><p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>Analyzing Database…</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <SummaryCard label="Total Collected Revenue" value={`$${data.totalRev.toLocaleString()}`} icon={DollarSign} c="emerald" />
            <SummaryCard label="Active Portfolio Value" value={`$${data.activeValue.toLocaleString()}`} icon={Briefcase} c="indigo" />
            <SummaryCard label="Total Client Base" value={data.totalClients} icon={Users} c="blue" />
          </div>

          {/* Revenue Chart */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p className="section-title">Revenue Timeline</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Actual collections over the last 8 months</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#6366f1' }} />Revenue
                </span>
              </div>
            </div>
            <div style={{ height: 340 }}>
              {data.revenue.reduce((s, x) => s + x.revenue, 0) === 0 ? (
                 <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                   <p className="empty-desc">No revenue data available for this period.</p>
                 </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TTStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#revG)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <p className="section-title" style={{ marginBottom: 24 }}>Project Volume</p>
              <div style={{ height: 260 }}>
                {data.projects.reduce((s, x) => s + x.projects, 0) === 0 ? (
                   <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                     <p className="empty-desc">No projects launched in this period.</p>
                   </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.projects} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                      <Tooltip contentStyle={TTStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="projects" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <p className="section-title" style={{ marginBottom: 24 }}>Client Acquisition</p>
              <div style={{ height: 260 }}>
                {data.clients.length === 0 || data.totalClients === 0 ? (
                  <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                    <p className="empty-desc">No clients registered.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.clients} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                      <Tooltip contentStyle={TTStyle} />
                      <Line type="stepAfter" dataKey="clients" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
