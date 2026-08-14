import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  // "Become a Donor" flow logic
  const handleBecomeDonor = () => {
    if (!user) {
      navigate('/select-role');
    } else if (roles && roles.includes('DONOR')) {
      navigate('/donor/dashboard');
    } else {
      navigate('/select-role');
    }
  };

  // "Request Blood" flow logic
  const handleRequestBlood = () => {
    if (!user) {
      navigate('/select-role');
    } else if (roles && roles.includes('RECEIVER')) {
      navigate('/receiver/request-blood');
    } else {
      navigate('/select-role');
    }
  };

  return (
    <div className="page-stack">
      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col justify-between min-h-[620px] bg-transparent border-none shadow-none overflow-visible py-6 px-4">
        {/* Top Branding (matching user collage) */}
        <div className="max-w-xl mx-auto pt-4 text-center relative z-10">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-brand-red">BLOOD</div>
          <div className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 mb-2">DONATION</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mt-1">
            Gift of Life
          </h1>
        </div>

        {/* Visual center spacer to expose the large centered background blood drop */}
        <div className="h-[230px] sm:h-[310px] w-full pointer-events-none" aria-hidden="true" />

        {/* Bottom CTAs & Tagline */}
        <div className="max-w-xl mx-auto pb-4 text-center relative z-10">
          <p className="text-lg leading-7 text-slate-700 font-semibold mb-6">
            Donate blood. Save lives.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleBecomeDonor}
              className="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-red-dark transition"
            >
              Become a Donor
            </button>
            <button
              onClick={handleRequestBlood}
              className="inline-flex items-center justify-center rounded-xl border-2 border-brand-red bg-white/80 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-brand-red hover:bg-brand-red-light/35 transition"
            >
              Request Blood
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION: WHY DONATE? */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Awareness</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Why Donate Blood?</h2>
          <p className="text-sm text-slate-600 mt-2">
            Every donation is a critical gift that supports healthcare, emergency responses, and saves lives daily.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <div className="inline-flex items-center justify-center rounded-lg bg-red-100 p-2.5 text-brand-red">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Save Lives</h3>
            <p className="text-xs leading-5 text-slate-600">
              A single donation can be separated into multiple components (red blood cells, plasma, platelets) to help save up to three lives.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <div className="inline-flex items-center justify-center rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Emergency Support</h3>
            <p className="text-xs leading-5 text-slate-600">
              Accidents, surgical operations, and complex clinical treatments create an ongoing, immediate demand for blood transfusions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <div className="inline-flex items-center justify-center rounded-lg bg-emerald-100 p-2.5 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Support Blood Availability</h3>
            <p className="text-xs leading-5 text-slate-600">
              Blood has a limited shelf life. Regular, voluntary donations are essential to prevent shortages in local clinics and hospitals.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION: BLOOD AVAILABILITY PREVIEW */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid gap-6 md:grid-cols-3 items-center">
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Stock Overview</span>
            <h2 className="text-2xl font-bold text-slate-900">Blood Availability</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Monitor the live stock availability of registered blood groups. Select a blood group below to check district-wise stock verification or click to see the complete list.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <Link
              to="/blood-availability"
              className="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-red-dark transition"
            >
              View Blood Availability
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
            <Link
              key={group}
              to="/blood-availability"
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center hover:border-brand-red-light hover:bg-brand-red-light/10 transition"
            >
              <div className="text-lg font-black text-brand-red">{group}</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Verify Stock</div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION: DONATION ELIGIBILITY CTA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className="max-w-md mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Before You Donate</span>
          <h2 className="text-xl font-bold text-slate-900">Are you eligible to donate?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Review the donation eligibility information before registering as a donor.
          </p>
        </div>
        <div>
          <Link
            to="/donation-eligibility"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-brand-red-light transition"
          >
            Check Donation Eligibility
          </Link>
        </div>
      </section>

      {/* 4. SECTION: HOW IT WORKS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Workflow</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">How It Works</h2>
          <p className="text-sm text-slate-600 mt-2">
            Connecting voluntary donors and receivers through simple, streamlined steps.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-4 relative">
          <div className="text-center space-y-2 relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red font-bold border border-red-100">
              1
            </div>
            <h3 className="text-base font-semibold text-slate-900">Register</h3>
            <p className="text-xs text-slate-600 px-2 leading-relaxed">
              Create an account and set up your personal donor or receiver role profile.
            </p>
          </div>

          <div className="text-center space-y-2 relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red font-bold border border-red-100">
              2
            </div>
            <h3 className="text-base font-semibold text-slate-900">Donate / Request</h3>
            <p className="text-xs text-slate-600 px-2 leading-relaxed">
              Declare donation availability or file urgent blood request tickets.
            </p>
          </div>

          <div className="text-center space-y-2 relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red font-bold border border-red-100">
              3
            </div>
            <h3 className="text-base font-semibold text-slate-900">Connect</h3>
            <p className="text-xs text-slate-600 px-2 leading-relaxed">
              Coordinators match requests with eligible voluntary donors in the area.
            </p>
          </div>

          <div className="text-center space-y-2 relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red font-bold border border-red-100">
              4
            </div>
            <h3 className="text-base font-semibold text-slate-900">Save Lives</h3>
            <p className="text-xs text-slate-600 px-2 leading-relaxed">
              Confirm donations, update history logs, and coordinate safe blood handovers.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/how-donation-works"
            className="inline-flex items-center text-xs font-semibold text-brand-red hover:text-brand-red-dark hover:underline transition"
          >
            Learn how it works &rarr;
          </Link>
        </div>
      </section>

      {/* 5. SECTION: EMERGENCY BLOOD REQUEST */}
      <section className="rounded-2xl border border-slate-200 bg-red-50/50 p-6 sm:p-8 shadow-sm grid gap-6 md:grid-cols-3 items-center">
        <div className="md:col-span-2 space-y-3">
          <span className="inline-flex rounded-full bg-brand-red-light px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-brand-red">
            Urgent Needs
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Need Blood Urgently?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Submit a blood request and connect with the appropriate blood-donation workflow. Our platform broadcasts matching signals to voluntary donors and coordinators.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleRequestBlood}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-red-dark transition"
          >
            Request Blood
          </button>
        </div>
      </section>

      {/* 6. SECTION: BECOME A DONOR */}
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 shadow-sm text-white grid gap-6 md:grid-cols-3 items-center">
        <div className="md:col-span-2 space-y-3">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-red-200">
            Join the Cause
          </span>
          <h2 className="text-2xl font-bold">Become a Donor</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your single voluntary donation can help a patient in critical need when they need it most. Register as a donor and support your community.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleBecomeDonor}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-red shadow-md hover:bg-slate-100 transition"
          >
            Become a Donor
          </button>
        </div>
      </section>

      {/* 7. SECTION: ABOUT ASN RAJU BLOOD BANK */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-8 md:grid-cols-2 items-center">
        {/* Left: Organization Image Placeholder */}
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 h-[240px] flex items-center justify-center text-slate-400">
          <div className="text-center space-y-2">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider block">Image Placeholder</span>
          </div>
        </div>

        {/* Right: Intro & Info */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Our Partner</span>
          <h2 className="text-2xl font-bold text-slate-900">About ASN Raju Blood Bank</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ASN Raju Blood Bank serves as a central coordinate for voluntary blood donations in the district. Working closely with our platform, the blood bank facilitates safe storage, stock verification, and local camp registries.
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <div><strong className="text-slate-700">Location:</strong> District General Hospital Campus (Details to be updated)</div>
            <div><strong className="text-slate-700">Contact:</strong> Information will be updated once confirmed by the bank.</div>
          </div>
          <div>
            <Link
              to="/blood-banks"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}