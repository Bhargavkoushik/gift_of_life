import PageHeader from '../../components/PageHeader';
import PlaceholderSection from '../../components/PlaceholderSection';

export default function BloodAvailability() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Blood Availability"
        description="A future search page for checking blood availability will be added here."
      />
      <PlaceholderSection
        title="Availability search"
        description="Search controls and results will be added in a later phase."
      />
    </div>
  );
}