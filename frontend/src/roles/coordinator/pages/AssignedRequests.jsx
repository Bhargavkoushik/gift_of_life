import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function AssignedRequests() {
  return (
    <div className="page-stack">
      <PageHeader title="Assigned Requests" description="Requests assigned to coordinators will appear here later." />
      <PlaceholderSection title="Assigned requests" description="Request assignment cards will be added later." />
    </div>
  );
}