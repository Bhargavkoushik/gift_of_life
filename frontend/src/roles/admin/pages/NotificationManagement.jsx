import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  deleteAdminNotification,
  sendEmergencyNotification,
  sendAdminReminder,
  reassignCoordinatorEscalation,
  getActiveCoordinators
} from '../../../services/adminService';

// Format relative date-time helper
const formatTimeAgo = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  if (isNaN(seconds)) return '';
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Category parser
const getCategoryDetails = (title) => {
  if (title.startsWith('ESCALATION:')) {
    return {
      category: 'ESCALATION',
      cleanTitle: title.replace('ESCALATION:', '').trim(),
      badgeBg: 'bg-red-50 text-red-700 border border-red-100',
      icon: (
        <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 font-black text-xs font-mono">
          !
        </span>
      )
    };
  }
  if (title.startsWith('EMERGENCY:')) {
    return {
      category: 'EMERGENCY',
      cleanTitle: title.replace('EMERGENCY:', '').trim(),
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse',
      icon: (
        <span className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-xs">
          🚨
        </span>
      )
    };
  }
  if (title.startsWith('SYSTEM_ERROR:')) {
    return {
      category: 'SYSTEM_ERROR',
      cleanTitle: title.replace('SYSTEM_ERROR:', '').trim(),
      badgeBg: 'bg-red-50 text-red-700 border border-red-100',
      icon: (
        <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs">
          ⚠️
        </span>
      )
    };
  }
  if (title.startsWith('INFORMATION:')) {
    return {
      category: 'INFORMATION',
      cleanTitle: title.replace('INFORMATION:', '').trim(),
      badgeBg: 'bg-blue-50 text-blue-700 border border-blue-100',
      icon: (
        <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-[10px] font-bold">
          ℹ️
        </span>
      )
    };
  }
  if (title.startsWith('REMINDER:')) {
    return {
      category: 'REMINDER',
      cleanTitle: title.replace('REMINDER:', '').trim(),
      badgeBg: 'bg-slate-50 text-slate-700 border border-slate-200',
      icon: (
        <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 text-xs">
          ⏰
        </span>
      )
    };
  }
  if (title.startsWith('ACTION_REQUIRED:')) {
    return {
      category: 'ACTION_REQUIRED',
      cleanTitle: title.replace('ACTION_REQUIRED:', '').trim(),
      badgeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      icon: (
        <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-[10px] font-bold">
          ⚡
        </span>
      )
    };
  }
  return {
    category: 'INFORMATION',
    cleanTitle: title,
    badgeBg: 'bg-slate-50 text-slate-700 border border-slate-200',
    icon: (
      <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 text-[10px] font-bold">
        ℹ️
      </span>
    )
  };
};

export default function NotificationManagement() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UNREAD, ESCALATIONS, EMERGENCY
  
  // Modals state
  const [viewMoreOpen, setViewMoreOpen] = useState(false);
  const [confirmEmergency, setConfirmEmergency] = useState(null); // holds target notification object
  const [reassignTarget, setReassignTarget] = useState(null); // holds target notification object
  const [confirmDelete, setConfirmDelete] = useState(null); // holds target notification object
  
  // Reassignment form state
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAdminNotifications();
      if (data && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Fetch active eligible coordinators on opening reassignment modal
  useEffect(() => {
    if (reassignTarget) {
      const fetchCoords = async () => {
        try {
          const res = await getActiveCoordinators();
          if (res && res.success) {
            setCoordinators(res.coordinators || []);
          }
        } catch (err) {
          console.error('Failed to fetch active coordinators:', err);
        }
      };
      fetchCoords();
    }
  }, [reassignTarget]);

  // Dispatch layout update helper
  const notifyLayoutUpdate = () => {
    window.dispatchEvent(new Event('admin-notifications-updated'));
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
      );
      notifyLayoutUpdate();
    } catch (err) {
      alert(err.message || 'Failed to mark notification as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setConfirmDelete(null);
      notifyLayoutUpdate();
      showToast('Notification deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete notification');
    }
  };

  const handleSendReminder = async (id) => {
    try {
      const res = await sendAdminReminder(id);
      if (res && res.success) {
        showToast('Reminder notification sent to coordinator.');
        await loadNotifications();
        notifyLayoutUpdate();
      }
    } catch (err) {
      alert(err.message || 'Failed to send reminder.');
    }
  };

  const handleSendEmergency = async () => {
    if (!confirmEmergency) return;
    try {
      const res = await sendEmergencyNotification(confirmEmergency.id);
      if (res && res.success) {
        showToast('Urgent emergency notification sent to coordinator.');
        setConfirmEmergency(null);
        await loadNotifications();
        notifyLayoutUpdate();
      }
    } catch (err) {
      alert(err.message || 'Failed to send emergency notification');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignTarget || !selectedCoordinatorId || !reassignReason.trim()) return;
    try {
      setSubmittingReassign(true);
      const res = await reassignCoordinatorEscalation(reassignTarget.id, selectedCoordinatorId, reassignReason);
      if (res && res.success) {
        showToast(res.message);
        setReassignTarget(null);
        setSelectedCoordinatorId('');
        setReassignReason('');
        await loadNotifications();
        notifyLayoutUpdate();
      }
    } catch (err) {
      alert(err.message || 'Failed to reassign coordinator');
    } finally {
      setSubmittingReassign(false);
    }
  };

  // Filter helper
  const getFilteredNotifications = (items) => {
    return items.filter(n => {
      const { category } = getCategoryDetails(n.title);
      if (activeFilter === 'UNREAD') return n.status !== 'READ';
      if (activeFilter === 'ESCALATIONS') return category === 'ESCALATION';
      if (activeFilter === 'EMERGENCY') return category === 'EMERGENCY';
      return true;
    });
  };

  const filteredList = getFilteredNotifications(notifications);
  const unreadCount = notifications.filter(n => n.status !== 'READ').length;

  const renderNotificationRow = (n) => {
    const isUnread = n.status !== 'READ';
    const parsed = getCategoryDetails(n.title);
    const terminalStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
    const isResolved = terminalStatuses.includes(n.request_status);

    return (
      <div 
        key={n.id}
        className={`flex flex-col md:flex-row justify-between gap-4 p-4 border rounded-xl transition-all duration-200 ${
          isUnread 
            ? 'bg-rose-50/20 border-rose-100 border-l-3 border-l-brand-red' 
            : 'bg-white border-slate-150'
        }`}
      >
        <div className="flex gap-3 min-w-0">
          <div className="mt-0.5">{parsed.icon}</div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${parsed.badgeBg}`}>
                {parsed.category}
              </span>
              {n.blood_group && (
                <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                  {n.blood_group}
                </span>
              )}
              {isResolved && (
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                  Resolved
                </span>
              )}
              <span className="text-[10px] font-semibold text-slate-400 font-mono">
                {formatTimeAgo(n.created_at)}
              </span>
            </div>
            
            <h4 className="text-xxs font-black text-slate-800 tracking-tight leading-tight">
              {parsed.cleanTitle}
            </h4>
            
            <p className="text-xxs font-medium text-slate-650 leading-snug">
              {n.message}
            </p>

            {n.coordinator_name && (
              <div className="text-[10px] font-bold text-slate-500 flex flex-wrap gap-x-2 pt-0.5">
                <span>Coordinator: <strong className="text-slate-700">{n.coordinator_name}</strong></span>
                {n.request_status && <span>· Live Request: <strong className="uppercase text-brand-red">{n.request_status}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          {n.request_id && (
            <button
              onClick={() => navigate(`/admin/requests/${n.request_id}`)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black transition cursor-pointer"
            >
              View Request
            </button>
          )}

          {parsed.category === 'ESCALATION' && !isResolved && (
            <>
              <button
                onClick={() => handleSendReminder(n.id)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black transition cursor-pointer"
              >
                Send Reminder
              </button>
              <button
                onClick={() => setConfirmEmergency(n)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-550 hover:bg-amber-600 text-white text-[10px] font-black transition cursor-pointer"
              >
                Send Emergency Notice
              </button>
            </>
          )}

          {parsed.category === 'EMERGENCY' && !isResolved && (
            <button
              onClick={() => setReassignTarget(n)}
              className="px-2.5 py-1.5 rounded-lg bg-brand-red hover:bg-rose-700 text-white text-[10px] font-black transition cursor-pointer"
            >
              Reassign Coordinator
            </button>
          )}

          {isUnread && (
            <button
              onClick={() => handleMarkAsRead(n.id)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold transition cursor-pointer"
            >
              Mark Read
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(n)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title="Delete notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-stack max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Administrative Notifications" 
        description="Admin supervision queue. Monitor coordinator delays, send emergency alerts, and reassign stalled requests." 
      />

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-850 text-white px-4 py-2.5 rounded-xl text-xxs font-bold shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter tab selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-150 rounded-xl p-3 shadow-xxs">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Activities' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'ESCALATIONS', label: 'Escalations' },
            { id: 'EMERGENCY', label: 'Emergency Alerts' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-rose-50 text-brand-red border border-rose-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2 bg-white border border-slate-150 rounded-2xl shadow-xxs">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-rose-200 border-t-brand-red" />
          <span className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">Syncing queue...</span>
        </div>
      ) : error ? (
        <div className="p-5 border border-red-100 bg-red-50/50 rounded-2xl text-center text-rose-700 text-xxs font-semibold">
          ❌ {error}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-150 rounded-2xl shadow-xxs text-center p-6">
          <span className="text-xl mb-1">✓</span>
          <h4 className="text-xxs font-black text-slate-800 uppercase tracking-wider">All caught up</h4>
          <p className="text-[10px] font-semibold text-slate-450 mt-1 max-w-xs">
            No pending notifications match the selected filter. Coordinators are performing tasks normally.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xxs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xxs font-black uppercase tracking-wider text-slate-450">
              Notification Queue (Latest 5)
            </h3>
            {filteredList.length > 5 && (
              <button
                onClick={() => setViewMoreOpen(true)}
                className="text-[10px] font-black text-brand-red hover:underline cursor-pointer"
              >
                View More ({filteredList.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredList.slice(0, 5).map(n => renderNotificationRow(n))}
          </div>

          {filteredList.length > 5 && (
            <button
              onClick={() => setViewMoreOpen(true)}
              className="w-full py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-xl text-xxs font-bold text-slate-700 transition cursor-pointer text-center"
            >
              View More Notifications ({filteredList.length - 5} older items)
            </button>
          )}
        </div>
      )}

      {/* 1. VIEW MORE NOTIFICATIONS MODAL (Scrollable Full History) */}
      {viewMoreOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Full Notification History
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Showing all {filteredList.length} matching administrative alerts
                </p>
              </div>
              <button
                onClick={() => setViewMoreOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable list content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0 bg-slate-50/50">
              {filteredList.map(n => renderNotificationRow(n))}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setViewMoreOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEND EMERGENCY NOTIFICATION CONFIRMATION MODAL */}
      {confirmEmergency && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 text-amber-600">
              <span className="text-xl">🚨</span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Send Emergency Notification?
              </h3>
            </div>
            
            <div className="text-xxs font-medium text-slate-650 space-y-2">
              <p>
                This will send an urgent action alert request to the assigned coordinator via their active communication channels (SMS/Email simulation).
              </p>
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-1 font-sans">
                <div>Request: <strong className="text-slate-800">#{confirmEmergency.request_id?.slice(0, 8)}</strong></div>
                {confirmEmergency.blood_group && <div>Blood Group: <strong className="text-slate-800">{confirmEmergency.blood_group}</strong></div>}
                <div>Coordinator: <strong className="text-slate-800">{confirmEmergency.coordinator_name}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmEmergency(null)}
                className="px-3.5 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-xxs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmergency}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xxs font-black transition cursor-pointer"
              >
                Send Emergency Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REASSIGN COORDINATOR MODAL */}
      {reassignTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 text-rose-600">
              <span className="text-xl">🔄</span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Reassign Coordinator
              </h3>
            </div>

            <form onSubmit={handleReassign} className="space-y-4">
              <div className="text-xxs font-medium text-slate-650 space-y-1.5">
                <div>
                  Current Coordinator: <strong className="text-slate-800">{reassignTarget.coordinator_name}</strong>
                </div>
                <div>
                  Request: <strong className="text-slate-800">#{reassignTarget.request_id?.slice(0, 8)}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-450">
                  New Coordinator
                </label>
                {coordinators.length === 0 ? (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xxs font-semibold text-rose-700">
                    ⚠️ No available coordinator (no active eligible coordinators found).
                  </div>
                ) : (
                  <select
                    value={selectedCoordinatorId}
                    onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xxs font-semibold focus:outline-rose-500 focus:border-rose-500"
                  >
                    <option value="">-- Select Active Coordinator --</option>
                    {coordinators.map(c => (
                      <option key={c.coordinator_profile_id} value={c.coordinator_profile_id}>
                        {c.name} {c.area ? `(${c.area}, ${c.district})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-450">
                  Reason for Reassignment
                </label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Coordinator did not respond within required time frame."
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xxs font-semibold focus:outline-rose-500 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setReassignTarget(null);
                    setSelectedCoordinatorId('');
                    setReassignReason('');
                  }}
                  className="px-3.5 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-xxs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || coordinators.length === 0}
                  className="px-3.5 py-2 rounded-lg bg-brand-red hover:bg-rose-700 text-white text-xxs font-black transition cursor-pointer disabled:opacity-50"
                >
                  {submittingReassign ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DELETE NOTIFICATION CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 p-5 space-y-4 animate-scale-up">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Delete notification?
            </h3>
            
            <p className="text-xxs font-medium text-slate-650 leading-relaxed">
              This removes the notification from your notification list. The underlying activity will remain permanently in Audit Logs.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3.5 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-xxs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xxs font-black transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}