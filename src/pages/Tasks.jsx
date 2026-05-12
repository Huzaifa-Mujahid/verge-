import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckSquare, Plus, Search, Filter, 
  Clock, AlertCircle, CheckCircle2, 
  Calendar, User, Tag, ChevronRight,
  MoreVertical, X, Loader2, Edit3, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PRIORITY_COLORS = {
  Low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  High: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const Tasks = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [newTask, setNewTask] = useState({
    id: null,
    title: '',
    client_id: '',
    assigned_to: '',
    priority: 'Medium',
    duration: '',
    due_date: '',
    description: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchTasks();
    if (isAdmin || isManager) {
      fetchStaff();
      fetchClients();
    }

    // Handle Quick Action
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      openAddTask();
      // Clear the param from URL
      navigate(location.pathname, { replace: true });
    }
  }, [user, location.search]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('tasks').select('*, clients(full_name)').order('created_at', { ascending: false });
      
      // If not Admin/Manager, only see assigned tasks
      if (!isAdmin && !isManager) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('user_roles').select('user_id, full_name, role');
    setStaffList(data || []);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name');
    setClients(data || []);
  };

  const openAddTask = () => {
    setIsEdit(false);
    setNewTask({ id: null, title: '', client_id: '', assigned_to: '', priority: 'Medium', duration: '', due_date: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setIsEdit(true);
    setNewTask({
      id: task.id,
      title: task.title,
      client_id: task.client_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      duration: task.duration || '',
      due_date: task.due_date || '',
      description: task.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        title: newTask.title,
        client_id: newTask.client_id || null,
        assigned_to: newTask.assigned_to || user.id,
        priority: newTask.priority,
        duration: newTask.duration,
        due_date: newTask.due_date || null,
        description: newTask.description
      };

      if (isEdit) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', newTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([{ ...payload, status: 'Pending' }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setNewTask({ id: null, title: '', client_id: '', assigned_to: '', priority: 'Medium', duration: '', due_date: '', description: '' });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchTasks();
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">Track and assign workflow responsibilities</p>
        </div>
        <button onClick={openAddTask} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="input input-icon w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="input md:w-48"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
        ) : filteredTasks.length === 0 ? (
          <div className="card p-20 text-center text-slate-500">No tasks found.</div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`card p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
              <button 
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-indigo-500'
                }`}
              >
                {task.status === 'Completed' && <CheckCircle2 size={14} />}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-bold text-sm ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><User size={12} /> {task.clients?.full_name || 'General Task'}</span>
                  {task.duration && <span className="flex items-center gap-1.5"><Clock size={12} /> {task.duration}</span>}
                  {task.due_date && <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block mr-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned To</p>
                  <p className="text-xs text-indigo-400 font-semibold">
                    {task.assigned_to === user.id ? 'You' : (staffList.find(s => s.user_id === task.assigned_to)?.full_name || 'Member')}
                  </p>
                </div>
                <button onClick={() => openEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors" title="Edit Task">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors" title="Delete Task">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-box max-w-lg">
              <div className="modal-header">
                <span className="modal-title">{isEdit ? 'Update Task' : 'Create New Task'}</span>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Task Title</label>
                    <input className="input" placeholder="e.g. Weekly Report Preparation" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                  </div>
                  
                  <div>
                    <label className="label">Related Client</label>
                    <select className="input" value={newTask.client_id} onChange={e => setNewTask({...newTask, client_id: e.target.value})}>
                      <option value="">Select Client (Optional)</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Assign To</label>
                    <select className="input" value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                      <option value="">Assign to Me</option>
                      {staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.role})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Duration / Effort</label>
                    <input className="input" placeholder="e.g. 2 hours" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: e.target.value})} />
                  </div>

                  <div>
                    <label className="label">Due Date</label>
                    <input type="date" className="input" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} onClick={(e) => e.target.showPicker?.()} />
                  </div>

                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input min-h-[100px]" placeholder="Detailed instructions..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary min-w-[120px]" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : (isEdit ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
