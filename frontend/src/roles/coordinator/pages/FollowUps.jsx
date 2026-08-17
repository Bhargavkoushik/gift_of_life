import PageHeader from '../../../components/PageHeader';

export default function FollowUps() {
  return (
    <div className="page-stack">
      <PageHeader title="Follow-ups" description="Manage pending follow-ups for donor visits." />
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
        <p className="text-slate-500 font-medium">No follow-up tasks registered.</p>
        <p className="text-sm text-slate-400 mt-1">Pending visits requiring coordinator follow-ups will be listed here.</p>
      </div>
    </div>
  );
}