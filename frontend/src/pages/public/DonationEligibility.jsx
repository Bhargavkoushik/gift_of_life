import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DonationEligibility() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  // Follows the same dynamic onboarding/redirect behavior as the home page
  const handleBecomeDonorCTA = () => {
    if (!user) {
      navigate('/select-role');
    } else if (roles && roles.includes('DONOR')) {
      navigate('/donor/dashboard');
    } else {
      navigate('/select-role');
    }
  };

  return (
    <div className="page-stack">
      {/* 1. PAGE TITLE */}
      <section className="text-center py-6 px-4 max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Donation Eligibility
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Learn about the information you should review before registering as a blood donor.
        </p>
      </section>

      {/* 2. ELIGIBILITY INTRODUCTION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-950">Pre-Donation Medical Assessment</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Before donating blood, all potential donors undergo a brief medical assessment conducted by authorized clinical staff. This check ensures that the donation process is safe for you and that the donated blood is safe for recipients.
        </p>
        <div className="rounded-xl bg-slate-50 p-4 border-l-4 border-brand-red text-xs text-slate-600 leading-relaxed">
          <strong>Important Notice:</strong> The final decision regarding your eligibility to donate blood belongs exclusively to the authorized medical and blood-bank staff on the day of the donation. This website does not replace professional medical evaluations.
        </div>
      </section>

      {/* 3. ELIGIBILITY INFORMATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Requirements</span>
          <h2 className="text-xl font-bold text-slate-900">General Eligibility Guidelines</h2>
          <p className="text-xs text-slate-500">
            Below are general evaluation categories. Specific medical parameters will be evaluated at the donation camp or bank.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Basic Eligibility Parameters</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Age, weight, and general health boundaries will be evaluated.
            </p>
            <p className="text-xs italic text-slate-400">
              "Eligibility criteria will be provided by the authorized blood-bank/medical team."
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Health & Wellbeing Check</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Hemoglobin levels, blood pressure, temperature, and pulse rate checks.
            </p>
            <p className="text-xs italic text-slate-400">
              "Eligibility criteria will be provided by the authorized blood-bank/medical team."
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Donation History & Gaps</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              The required waiting period since your last successful blood or components donation.
            </p>
            <p className="text-xs italic text-slate-400">
              "Eligibility criteria will be provided by the authorized blood-bank/medical team."
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Current Medical Status</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Evaluations regarding active medications, chronic conditions, or recent travel.
            </p>
            <p className="text-xs italic text-slate-400">
              "Eligibility criteria will be provided by the authorized blood-bank/medical team."
            </p>
          </div>
        </div>
      </section>

      {/* 4. TEMPORARY DEFERRAL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-950">Understanding Temporary Deferral</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Some conditions, medications, or travel situations may result in a temporary deferral rather than a permanent restriction. A temporary deferral means you cannot donate blood for a specific duration of time.
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          Once the deferral period expires (represented in the database system as a donor profile's <code className="rounded bg-slate-100 px-1 py-0.5 font-semibold text-brand-red">deferred_until</code> date), you can visit a camp or bank for another eligibility check. This ensures patient safety while welcoming voluntary donors back.
        </p>
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 leading-relaxed">
          <strong>Deferral Duration Note:</strong> Deferral periods vary based on local guidelines and clinical reasons. Specific durations and rules will be explained by the clinical team at the facility.
        </div>
      </section>

      {/* 5. BEFORE DONATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-950">How to Prepare</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Follow recommended general wellbeing guidelines on the day of your donation to ensure a comfortable experience.
        </p>
        <div className="rounded-xl bg-slate-50/50 border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
          "Preparation guidance will be provided by the authorized blood-bank/medical team."
        </div>
      </section>

      {/* 6. WHEN TO SEEK GUIDANCE */}
      <section className="rounded-2xl border border-slate-200 bg-red-50/50 p-6 sm:p-8 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-slate-950">When to Seek Medical Guidance</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          If you have active prescriptions, are undergoing treatment, or have questions about a recent health situation, we encourage you to contact the appropriate medical/blood-bank staff directly.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Our coordinators and partner facilities will help guide you without providing formal diagnosis or medical advice through the digital interface.
        </p>
      </section>

      {/* 7. BECOME A DONOR CTA */}
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 shadow-sm text-white grid gap-6 md:grid-cols-3 items-center">
        <div className="md:col-span-2 space-y-3">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-200">
            Registration
          </span>
          <h2 className="text-2xl font-bold">Ready to Become a Donor?</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Begin the voluntary registration process. Setting up your profile will help us notify you of matching blood requests or upcoming camps.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleBecomeDonorCTA}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-red shadow-md hover:bg-slate-100 transition"
          >
            Become a Donor
          </button>
        </div>
      </section>
    </div>
  );
}