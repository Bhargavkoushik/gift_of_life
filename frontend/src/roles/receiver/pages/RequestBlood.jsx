import PageHeader from '../../../components/PageHeader';
import PlaceholderSection from '../../../components/PlaceholderSection';

const futureSections = [
  'Patient details',
  'Blood group',
  'Required units',
  'Hospital details',
  'Urgency',
  'Required date/time',
  'Contact information',
];

export default function RequestBlood() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Blood Request Form"
        description="To be implemented."
      />
      <PlaceholderSection
        title="Future sections"
        description="This page is only a skeleton for the future request form."
        items={futureSections}
      />
    </div>
  );
}