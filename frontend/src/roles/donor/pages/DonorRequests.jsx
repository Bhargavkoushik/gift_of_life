import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function DonorRequests() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Emergency Requests"
        description="Emergency request listings for donors will be shown here later."
      />
      <PlaceholderSection title="Requests" description="Request cards and response options will be added later." />
    </div>
  );
}