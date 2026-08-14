import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function HowDonationWorks() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  // Follows the same dynamic onboarding/redirect behavior as the home page
  const handleBecomeDonor = () => {
    if (!user) {
      navigate('/select-role');
    } else if (roles && roles.includes('DONOR')) {
      navigate('/donor/dashboard');
    } else {
      navigate('/select-role');
    }
  };

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
      {/* 1. PAGE TITLE / INTRODUCTION */}
      <section className="text-center py-6 px-4 max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          How Donation Works
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Learn how our platform facilitates voluntary blood donations and request matches.
        </p>
      </section>

      {/* 2. DETAILED WORKFLOW SECTIONS */}
      <section className="space-y-6">
        {/* Step 1: Register */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-6 md:grid-cols-3 items-start">
          <div className="flex items-center gap-3 md:flex-col md:items-start shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm select-none">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-955">Registration & Roles</h2>
          </div>
          <div className="md:col-span-2 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              To get started, create a single user account. Our platform supports a multi-role design: instead of making separate accounts, your single profile can hold both <strong>Donor</strong> and <strong>Receiver</strong> credentials.
            </p>
            <p>
              Once your account is set up, you can promote your profile to one or both roles. Coordinators and administrators can also access specific tools using their assigned authorization boundaries.
            </p>
          </div>
        </div>

        {/* Step 2: Donate or Request */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-6 md:grid-cols-3 items-start">
          <div className="flex items-center gap-3 md:flex-col md:items-start shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm select-none">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-955">Declare or Request</h2>
          </div>
          <div className="md:col-span-2 grid gap-6 sm:grid-cols-2 text-sm text-slate-600 leading-relaxed">
            <div className="space-y-2 border-r border-slate-100 pr-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-brand-red font-semibold select-none">🩸</span> Donor Path
              </h3>
              <p className="text-xs">
                Promote your profile to the Donor role, complete your donor questionnaire, and declare your donation availability. This makes you searchable for regional matches.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-brand-red font-semibold select-none">📋</span> Receiver Path
              </h3>
              <p className="text-xs">
                Promote your profile to the Receiver role, complete the details, and file a blood request ticket specifying the required blood group, location, and urgency status.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Connect */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-6 md:grid-cols-3 items-start">
          <div className="flex items-center gap-3 md:flex-col md:items-start shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm select-none">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-955">Matching & Coordination</h2>
          </div>
          <div className="md:col-span-2 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              When a receiver files a request, our matching query looks up nearby voluntary donors of matching blood groups. Matches trigger status alerts for coordinates.
            </p>
            <p>
              Donors can review the request details in their dashboard and declare whether they accept or decline the response. Regional coordinators assist in scheduling handovers.
            </p>
          </div>
        </div>

        {/* Step 4: Save Lives */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-6 md:grid-cols-3 items-start">
          <div className="flex items-center gap-3 md:flex-col md:items-start shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm select-none">
              4
            </span>
            <h2 className="text-lg font-bold text-slate-955">Fulfillment & History</h2>
          </div>
          <div className="md:col-span-2 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              Once a donation is completed, the coordinator verifies the transaction. The database system records the donation logs, satisfying the active request ticket.
            </p>
            <p>
              This closes the matching loop, increments the donor's history logs, and keeps public inventory statistics updated for accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ADDITIONAL CONTENT: JOURNEY SUMMARIES */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-955">For Donors</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            As a voluntary donor, your journey involves maintaining availability, responding to notifications for matching local requests, participating in camps, and checking details like deferral durations.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-955">For Receivers</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            As a receiver, your journey focuses on filing clear blood requirement tickets (specifying blood group, units, hospital venue, and urgency) and coordinating with matched donors and campaign workers.
          </p>
        </div>
      </section>

      {/* 4. OTHER PUBLIC REFERENCES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-955">Blood Donation Camps</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Donors can also participate in organized community camps. Camps provide a direct venue for walk-in donations. Explore schedules on our public camp directory.
          </p>
          <div>
            <Link
              to="/blood-camps"
              className="inline-flex items-center text-xs font-semibold text-brand-red hover:underline"
            >
              View Camps &rarr;
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-955">Public Blood Availability</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live stocks at local partner facilities can be searched in real-time. Check verified groups and locations in our database directories.
          </p>
          <div>
            <Link
              to="/blood-availability"
              className="inline-flex items-center text-xs font-semibold text-brand-red hover:underline"
            >
              Check Stock &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 shadow-sm text-white text-center space-y-4">
        <div className="max-w-md mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Get Started</span>
          <h2 className="text-2xl font-bold">Ready to take the next step?</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Join the Gift of Life community today. Register as a donor or submit an emergency request to connect with coordinators.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <button
            onClick={handleBecomeDonor}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-red shadow-md hover:bg-slate-100 transition"
          >
            Become a Donor
          </button>
          <button
            onClick={handleRequestBlood}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white bg-transparent px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-white/10 transition"
          >
            Request Blood
          </button>
        </div>
      </section>
    </div>
  );
}