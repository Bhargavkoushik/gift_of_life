import PageHeader from '../../components/PageHeader';
import PlaceholderSection from '../../components/PlaceholderSection';

const homeSections = [
  { title: 'Need Blood', description: 'A future request entry point for receivers.' },
  { title: 'Donate Blood', description: 'A future entry point for voluntary donors.' },
  { title: 'Blood Availability Search', description: 'Search controls will be added later.' },
  { title: 'Blood Bank Directory', description: 'Directory content will be added later.' },
  { title: 'Blood Donation Camps', description: 'Camp listings will be added later.' },
  { title: 'Donor Login', description: 'Login access will be added later.' },
  { title: 'Register Voluntary Blood Camp', description: 'Registration flow will be added later.' },
  { title: 'Who Can Donate Blood?', description: 'Eligibility guidance will be added later.' },
  { title: 'How Donation Works', description: 'Donation steps will be added later.' },
];

export default function Home() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="max-w-3xl">
          <span className="hero-tag">Public user</span>
          <h1 className="hero-title">Gift of Life</h1>
          <p className="hero-description">
            Public entry point for blood donation awareness, availability, and future services.
          </p>
        </div>
      </section>

      <PageHeader
        title="Home"
        description="A simple starting page for people who want to learn about the platform."
      />

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="section-title">Home page sections</h2>
          <p className="section-description">
            These areas are reserved for the future public-facing experience.
          </p>
        </div>

        <div className="home-grid">
          {homeSections.map((section) => (
            <article key={section.title} className="section-tile">
              <p className="section-kicker">Placeholder</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{section.title}</h3>
              <p className="section-description">{section.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}