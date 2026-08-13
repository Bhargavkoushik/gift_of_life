import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function AdminDashboard() {
  return (
    <div className="page-stack">
      <PageHeader title="Admin Dashboard" description="Dashboard for administration and oversight pages." />

      <div className="compact-grid">
        <PlaceholderSection title="Total donors" description="Summary area reserved for future donor overview." />
        <PlaceholderSection title="Available donors" description="Availability overview will appear here later." />
        <PlaceholderSection title="Emergency requests" description="Emergency request overview will appear here later." />
        <PlaceholderSection title="Pending requests" description="Pending request overview will appear here later." />
        <PlaceholderSection title="Monthly donations" description="Monthly donation overview will appear here later." />
        <PlaceholderSection title="Active coordinators" description="Coordinator overview will appear here later." />
        <PlaceholderSection title="Rare donors" description="Rare donor overview will appear here later." />
      </div>
    </div>
  );
}