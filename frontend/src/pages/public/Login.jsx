import PageHeader from '../../components/PageHeader';
import PlaceholderSection from '../../components/PlaceholderSection';

export default function Login() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Login"
        description="Role-based sign-in will be introduced later."
      />
      <PlaceholderSection
        title="Login area"
        description="Authentication controls are intentionally not implemented yet."
      />
    </div>
  );
}