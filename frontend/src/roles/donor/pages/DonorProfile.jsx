import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function DonorProfile() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Donor Profile"
        description="Profile information for a donor will be shown here later."
      />
      <PlaceholderSection title="Profile details" description="Profile fields and summary blocks will appear here." />
    </div>
  );
}