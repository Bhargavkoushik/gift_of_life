import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function ReceiverNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadNotifications = async () => {
    try {
      const data = await receiverService.getNotifications();
      setNotifications(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await receiverService.markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Stay updated with coordinator verification approvals and matched donor updates."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {!errorMsg && notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm max-w-md mx-auto space-y-2">
          <p className="text-slate-500 font-semibold text-xs">No notifications found.</p>
          <span className="text-xxs text-slate-400 font-medium leading-relaxed block">
            Updates regarding your requests will appear here.
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-150 overflow-hidden">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                notif.status === 'PENDING' ? 'bg-rose-50/20' : ''
              }`}
            >
              <div className="flex gap-3">
                <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 transition ${
                  notif.status === 'PENDING' ? 'bg-brand-red animate-pulse' : 'bg-transparent'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${
                    notif.status === 'PENDING' ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                  }`}>
                    {notif.title}
                  </h4>
                  <p className="text-xxs text-slate-500 font-semibold mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                    {new Date(notif.created_at).toLocaleDateString()} · {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {notif.status === 'PENDING' && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xxs font-bold transition cursor-pointer shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}