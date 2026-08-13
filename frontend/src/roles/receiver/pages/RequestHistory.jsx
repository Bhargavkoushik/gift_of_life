import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function RequestHistory() {
  return (
    <div className="page-stack">
      <PageHeader title="Request History" description="Past blood requests will appear here later." />
      <PlaceholderSection title="Request history" description="History entries and filters will be added later." />
    </div>
  );
}