import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function DonorAvailability() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Donor Availability"
        description="Availability preferences and updates will be shown here later."
      />
      <PlaceholderSection title="Availability settings" description="Availability controls will be added in a future update." />
    </div>
  );
}