import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';

export default function DonorNotifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadNotifications = async () => {
    try {
      const data = await donorService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      setErrorMsg('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await donorService.markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (err) {
      setErrorMsg('Failed to update notification state.');
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
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Stay updated with incoming blood requests, coordinator updates, and matches."
      />

      <div className="space-y-4 max-w-2xl">
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <div className="text-sm font-bold text-slate-900 mb-1">No Notifications</div>
            <div className="text-xs">You have no notification logs in your inbox.</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {notifications.map((item) => {
              const isRead = item.status === 'READ';
              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleString()
                : 'N/A';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    !isRead ? 'border-brand-red border-l-4' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.title}</span>
                      {!isRead && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-brand-red" title="Unread"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                    <div className="text-[10px] text-slate-400 font-semibold">{dateStr}</div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="text-xxs font-bold text-brand-red hover:underline whitespace-nowrap self-end sm:self-auto cursor-pointer"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}