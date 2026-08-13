import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function DonorNotifications() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Donor Notifications"
        description="Donor notification space for later updates."
      />
      <PlaceholderSection title="Notifications" description="Notification items will appear here later." />
    </div>
  );
}