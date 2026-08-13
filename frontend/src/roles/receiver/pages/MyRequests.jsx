import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

export default function MyRequests() {
  return (
    <div className="page-stack">
      <PageHeader title="My Requests" description="A list of the receiver's requests will appear here later." />
      <PlaceholderSection title="Active requests" description="Request cards and summary blocks will appear here." />
    </div>
  );
}