import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';
import donorHeroImage from '../../../assets/donor_hero_image.jpeg';

export default function DonorDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    requests: [],
    history: [],
    notifications: []
  });
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profile, requests, history, notifications] = await Promise.all([
          donorService.getDonorProfile(),
          donorService.getMatchingRequests(),
          donorService.getDonationHistory(),
          donorService.getNotifications()
        ]);
        setData({ profile, requests, history, notifications });
      } catch (err) {
        setErrorMsg('We couldn\'t load your dashboard metrics right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleShare = async (req) => {
    const shareText = `Blood Request: ${req.blood_group} Needed (${req.required_units} Units)\nHospital: ${req.hospital_name}, ${req.location}\nNeeded by: ${new Date(req.required_date_time).toLocaleDateString()}`;
    const shareUrl = `${window.location.origin}/donor/requests`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emergency Blood Request',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
        alert('Blood request details copied to clipboard!');
      } catch (err) {
        alert('Failed to share details.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const { profile, requests, history, notifications } = data;
  const totalDonations = history.filter((d) => d.status === 'COMPLETED').length;

  const recentRequests = requests.slice(0, 2);
  const recentHistory = history.slice(0, 3);
  const recentNotifications = notifications.slice(0, 3);

  // Match / Eligibility Display calculations
  const isDeferred = profile?.eligibility_status === 'TEMPORARILY_DEFERRED';
  const isNotEligible = profile?.eligibility_status === 'NOT_ELIGIBLE';
  
  let eligibilityBadgeText = 'Eligible to Help';
  let eligibilityBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-150';
  let eligibilityDotClass = 'bg-emerald-500';
  let eligibilityDesc = 'Your profile can currently appear in compatible blood request matching.';
  let nextEligibleDateText = null;

  if (isDeferred) {
    eligibilityBadgeText = 'Not Eligible Yet';
    eligibilityBadgeClass = 'bg-amber-50 text-amber-700 border-amber-150';
    eligibilityDotClass = 'bg-amber-500';
    eligibilityDesc = 'Your latest recorded donation is still within the required waiting period.';
    if (profile?.deferred_until) {
      const deferDate = new Date(profile.deferred_until).toLocaleDateString(undefined, { dateStyle: 'medium' });
      nextEligibleDateText = `Next eligible matching date: ${deferDate}`;
    }
  } else if (isNotEligible) {
    eligibilityBadgeText = 'Not Eligible';
    eligibilityBadgeClass = 'bg-rose-50 text-rose-700 border-rose-150';
    eligibilityDotClass = 'bg-rose-500';
    eligibilityDesc = 'You are currently not eligible for compatible matching.';
  }

  return (
    <div className="page-stack max-w-7xl">
      {/* Informational Hero Section (Responsive stable two-column composition) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(320px,38%)]">
        
        {/* Left Column: Text Content */}
        <div className="p-6 sm:p-8 flex flex-col justify-center text-left space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red block">
            BLOOD DONATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight font-sans max-w-lg">
            Your First Donation Could Be Someone's Second Chance
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed font-sans max-w-md">
            Be ready when someone needs your blood group. Keep your medical details updated to ensure notifications are compatible.
          </p>
        </div>

        {/* Right Column: Flush Image (No inner borders or shadows, visual merge to parent border) */}
        <div className="relative min-h-[200px] md:min-h-full overflow-hidden shrink-0">
          <img
            src={donorHeroImage}
            alt="Person donating blood at a blood donation center"
            className="absolute inset-0 w-full h-full object-cover block"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* METRICS ROW (Immediately below hero) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Blood Group */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Blood Group</div>
          <div className="text-2xl font-extrabold text-brand-red">{profile?.blood_group || 'N/A'}</div>
          <div className="text-xxs text-slate-400 font-medium">Recorded Group</div>
        </div>

        {/* Donations Completed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Donations Completed</div>
          <div className="text-2xl font-extrabold text-slate-900">{totalDonations}</div>
          <div className="text-xxs text-slate-400 font-medium">Verified completed donations</div>
        </div>

        {/* Matching Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matching Requests</div>
          <div className="text-2xl font-extrabold text-slate-900">{requests.length}</div>
          <div className="text-xxs text-slate-400 font-medium">Compatible active requests</div>
        </div>

        {/* Last Donation Date */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Donation</div>
          <div className="text-sm font-bold text-slate-800 pt-2 pb-1">
            {profile?.last_donation_date
              ? new Date(profile.last_donation_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : 'No donation yet'}
          </div>
          <div className="text-xxs text-slate-400 font-medium">Recorded Date</div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Left (Matching Eligibility) vs Right (Recent Updates) */}
      <div className="grid gap-6 md:grid-cols-2 pt-2">
        
        {/* Donation/Matching Eligibility Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Matching Eligibility</h3>
            
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${eligibilityDotClass}`}></span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${eligibilityBadgeClass}`}>
                {eligibilityBadgeText}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              {eligibilityDesc}
            </p>

            {nextEligibleDateText && (
              <div className="text-xs font-bold text-brand-red bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 inline-block font-mono">
                {nextEligibleDateText}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xxs text-slate-450 leading-normal font-sans">
            ℹ️ Final medical eligibility is confirmed by medical staff at the blood centre.
          </div>
        </div>

        {/* Recent Updates (Notifications preview) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Recent Updates</h3>
              <Link to="/donor/notifications" className="text-xxs font-bold text-brand-red hover:underline">
                View All →
              </Link>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                You're all caught up. No new notifications.
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentNotifications.map((item) => (
                  <div key={item.id} className="text-xs leading-relaxed space-y-0.5 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{item.title}</span>
                      {item.status !== 'READ' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-red shrink-0"></span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xxs line-clamp-1">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE BLOOD REQUESTS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Active Blood Requests</h3>
          <Link to="/donor/requests" className="text-xxs font-bold text-brand-red hover:underline">
            View All →
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium space-y-1">
            <div className="font-bold text-slate-800 font-sans">No matching blood requests right now.</div>
            <div className="font-sans">We will show relevant requests here when they become available.</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentRequests.map((req) => (
              <div key={req.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-brand-red uppercase font-sans">{req.blood_group} · {req.required_units} Units</span>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5 font-sans">{req.hospital_name}</h4>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200 uppercase font-sans">
                      {req.urgency_level}
                    </span>
                  </div>
                  
                  <div className="text-xxs text-slate-500 space-y-1 font-sans">
                    <div><strong>Patient:</strong> {req.patient_name || 'Individual Patient'}</div>
                    <div><strong>Required by:</strong> {new Date(req.required_date_time).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                    <div className="line-clamp-2"><strong>Details:</strong> {req.description || 'Surgery / Medical Treatment'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                  <button
                    onClick={() => handleShare(req)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xxs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer font-sans"
                  >
                    Share
                  </button>
                  <Link
                    to="/donor/requests"
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 text-xxs font-bold transition font-sans"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT DONATIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Recent Donations</h3>
          <Link to="/donor/donation-history" className="text-xxs font-bold text-brand-red hover:underline">
            View All →
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-sans">
            No donations recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs text-slate-600 font-medium font-sans">
            {recentHistory.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div>
                  <div className="font-bold text-slate-850">
                    {new Date(item.donation_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                  <div className="text-slate-400 text-xxs mt-0.5">
                    {item.hospital_name || 'ASN Raju Blood Centre'}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-slate-700 font-semibold">{item.units} Unit(s)</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xxs font-bold text-emerald-700 border border-emerald-100">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}