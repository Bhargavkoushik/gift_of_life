import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function ReceiverDashboard() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Receiver Dashboard"
        description="Dashboard for people creating and tracking blood requests."
      />

      <div className="compact-grid">
        <PlaceholderSection title="Create Blood Request" description="Request creation entry point will appear here." />
        <PlaceholderSection title="Active Requests" description="Active request items will appear here." />
        <PlaceholderSection title="Request Status" description="Request status updates will appear here." />
        <PlaceholderSection title="Request History" description="Request history summary will appear here." />
        <PlaceholderSection title="Notifications" description="Receiver notifications will appear here." />
      </div>
    </div>
  );
}