import PageHeader from '../../../components/PageHeader';

export default function CoordinatorNotifications() {
  return (
    <div className="page-stack">
      <PageHeader title="Notifications" description="View system notifications and alerts." />
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
        <p className="text-slate-500 font-medium">No notifications found.</p>
        <p className="text-sm text-slate-400 mt-1">Updates about assigned cases and new responses will show up here.</p>
      </div>
    </div>
  );
}