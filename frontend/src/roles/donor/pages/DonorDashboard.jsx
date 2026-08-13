import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function DonorDashboard() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Donor Dashboard"
        description="Dashboard for registered blood donors."
      />

      <div className="compact-grid">
        <PlaceholderSection title="Profile Summary" description="Profile details will appear here." />
        <PlaceholderSection title="Blood Group" description="Blood group information will appear here." />
        <PlaceholderSection title="Availability" description="Availability status will appear here." />
        <PlaceholderSection title="Emergency Requests" description="Emergency request cards will appear here." />
        <PlaceholderSection title="Donation History" description="Donation history will appear here." />
        <PlaceholderSection title="Notifications" description="Notification updates will appear here." />
      </div>
    </div>
  );
}