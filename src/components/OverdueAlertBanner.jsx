import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const OverdueAlertBanner = ({ alerts = [] }) => {
  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="mb-6 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-rose-500/10 to-rose-600/10 border border-rose-500/20 rounded-[20px] p-4 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-rose-500/10 transition-all duration-700" />
          
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-rose-500 uppercase tracking-widest mb-0.5">Critical Attention Required</p>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              You have <span className="font-bold text-[var(--text-primary)]">{alerts.length} overdue items</span> that need immediate action.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              to="/reports" 
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
            >
              Review All <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OverdueAlertBanner;
