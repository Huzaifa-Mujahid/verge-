import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Mail, Phone, FileText, Calendar, 
  ChevronRight, Briefcase, DollarSign, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ClientTimeline = ({ limit = 15, clientId = null }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchActivities(); }, [clientId]);

  const fetchActivities = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      
      const [intRes, projRes] = await Promise.all([
        supabase.from('interactions').select('*').eq('client_id', clientId).order('interaction_date', { ascending: false }).limit(limit),
        supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit)
      ]);

      let allActivities = [];

      // Add Interactions
      (intRes.data || []).forEach(i => {
        allActivities.push({
          id: `int-${i.id}`,
          type: 'interaction',
          subType: i.type,
          title: i.type,
          notes: i.notes,
          date: new Date(i.interaction_date),
          raw: i
        });
      });

      // Add Projects
      (projRes.data || []).forEach(p => {
        allActivities.push({
          id: `proj-${p.id}`,
          type: 'project',
          title: 'New Project Created',
          notes: p.title,
          date: new Date(p.created_at),
          raw: p
        });
      });

      // Sort by date
      allActivities.sort((a, b) => b.date - a.date);
      setActivities(allActivities.slice(0, limit));
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const getStyle = (act) => {
    if (act.type === 'project') return { icon: <Briefcase />, color: 'var(--blue)', label: 'Project' };
    switch (act.subType?.toLowerCase()) {
      case 'email': return { icon: <Mail />, color: 'var(--indigo)', label: 'Email' };
      case 'call': return { icon: <Phone />, color: 'var(--emerald)', label: 'Call' };
      case 'meeting': return { icon: <Calendar />, color: 'var(--rose)', label: 'Meeting' };
      default: return { icon: <MessageSquare />, color: 'var(--amber)', label: 'Interaction' };
    }
  };

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" />
      <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>Analyzing activities…</p>
    </div>
  );

  if (activities.length === 0) return (
    <div className="empty-state" style={{ padding: '40px 0' }}>
      <p className="empty-desc">No activities recorded for this client yet.</p>
    </div>
  );

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 10, width: 2, background: 'var(--border)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activities.map((act, idx) => {
          const style = getStyle(act);
          return (
            <motion.div key={act.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} style={{ display: 'flex', gap: 14, position: 'relative' }}>
              <div style={{ 
                position: 'absolute', left: -26, top: 4, width: 26, height: 26, borderRadius: '50%', 
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: style.color, zIndex: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
              }}>
                {React.cloneElement(style.icon, { size: 13 })}
              </div>
              <div className="card" style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{style.label}</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{act.title}</p>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {act.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {act.notes}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientTimeline;
