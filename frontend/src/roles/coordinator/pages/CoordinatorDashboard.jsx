import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function CoordinatorDashboard() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Coordinator Dashboard"
        description="Dashboard for request coordination and follow-up tracking."
      />

      <div className="compact-grid">
        <PlaceholderSection title="Assigned Requests" description="Assigned requests will appear here." />
        <PlaceholderSection title="Emergency Requests" description="Emergency request items will appear here." />
        <PlaceholderSection title="Donor Responses" description="Donor response updates will appear here." />
        <PlaceholderSection title="Pending Follow-ups" description="Follow-up tasks will appear here." />
        <PlaceholderSection title="Completed Requests" description="Completed request summaries will appear here." />
      </div>
    </div>
  );
}