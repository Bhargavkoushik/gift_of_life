import PageHeader from '../../../components/PageHeader';

export default function DonorResponses() {
  return (
    <div className="page-stack">
      <PageHeader title="Donor Responses" description="Review donor responses to blood donation requests." />
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
        <p className="text-slate-500 font-medium">No donor responses requiring your action.</p>
        <p className="text-sm text-slate-400 mt-1">Accepted matches will appear under your active dashboard cases.</p>
      </div>
    </div>
  );
}