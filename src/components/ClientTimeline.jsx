import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, Phone, FileText, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ClientTimeline = ({ limit = 10, clientId = null }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchActivities(); }, [clientId]);

  const fetchActivities = async () => {
    try {
      let query = supabase.from('interactions').select('*, clients(full_name)').order('interaction_date', { ascending: false }).limit(limit);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email': return <Mail size={16} />;
      case 'call': return <Phone size={16} />;
      case 'meeting': return <Calendar size={16} />;
      case 'note': return <FileText size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const getColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'email': return 'var(--blue)';
      case 'call': return 'var(--emerald)';
      case 'meeting': return 'var(--indigo)';
      case 'note': return 'var(--amber)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" />
      <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>Loading timeline…</p>
    </div>
  );

  if (activities.length === 0) return (
    <div className="empty-state">
      <p className="empty-desc">No recent activity recorded.</p>
    </div>
  );

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 10, width: 2, background: 'var(--border)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activities.map((act, idx) => (
          <motion.div key={act.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} style={{ display: 'flex', gap: 14, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -26, top: 4, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: getColor(act.type), zIndex: 2 }}>
              {React.cloneElement(getIcon(act.type), { size: 12 })}
            </div>
            <div className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.clients?.full_name || 'System'}: <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{act.type}</span>
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {new Date(act.interaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{act.notes || 'No detailed notes provided.'}"
                </p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 12, marginTop: 2, flexShrink: 0 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ClientTimeline;
