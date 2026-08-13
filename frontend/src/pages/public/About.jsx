import PageHeader from '../../components/PageHeader';
import PlaceholderSection from '../../components/PlaceholderSection';

export default function About() {
  return (
    <div className="page-stack">
      <PageHeader
        title="About"
        description="Background information about the Gift of Life project will be placed here."
      />
      <PlaceholderSection
        title="Project overview"
        description="This page will eventually explain the mission, scope, and community purpose."
      />
    </div>
  );
}