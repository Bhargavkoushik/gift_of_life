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
        // ignore abort or errors
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
        alert('Blood request details copied to clipboard!');
      } catch (err) {
        alert('Failed to share details. Please copy the page URL manually.');
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

  const isAvailable = profile?.availability_status === 'AVAILABLE';
  const totalDonations = history.filter((d) => d.status === 'COMPLETED').length;

  // State-aware hero copy setup
  let headline = "Your Donation Can Save a Life";
  let supportingText = "Every donation can become someone's second chance.";
  let secondaryLine = "Keep your status updated to receive matching alerts when you are ready.";
  let ctaText = "View Blood Requests";
  let ctaLink = "/donor/requests";

  if (requests.length > 0) {
    headline = "Someone May Need Your Blood Group";
    supportingText = "Check the latest compatible request and see if you can help.";
    secondaryLine = "You have matching blood requests waiting for your response.";
    ctaText = "View Blood Requests";
    ctaLink = "/donor/requests";
  } else if (totalDonations === 0) {
    headline = "Your First Donation Could Be Someone's Second Chance";
    supportingText = "Be ready when someone needs your blood group.";
    secondaryLine = "Set your status to discoverable to start receiving compatibility alerts.";
    ctaText = "Become Ready to Donate";
    ctaLink = "/donor/availability";
  } else if (isAvailable) {
    headline = "You're Ready to Help Someone";
    supportingText = "Your profile is available for compatible blood requests in your area.";
    secondaryLine = "You are currently discoverable for matches. We will notify you of any matches.";
    ctaText = "View Blood Requests";
    ctaLink = "/donor/requests";
  } else if (totalDonations > 0) {
    headline = "Your Last Donation Made a Difference";
    supportingText = "Every donation can become someone's second chance.";
    secondaryLine = "Keep your status updated to receive matching alerts when you are ready.";
    ctaText = "View Blood Requests";
    ctaLink = "/donor/requests";
  }

  const isProfileIncomplete =
    !profile?.address?.trim() ||
    !profile?.area?.trim() ||
    !profile?.district?.trim() ||
    !profile?.state?.trim() ||
    !profile?.pincode?.trim() ||
    !profile?.date_of_birth ||
    !profile?.gender;

  const recentRequests = requests.slice(0, 3);
  const recentHistory = history.slice(0, 3);
  const recentNotifications = notifications.slice(0, 3);

  const activeRequest = requests.find((req) => req.response_status === 'ACCEPTED' && !['FULFILLED', 'CANCELLED'].includes(req.status));

  const handleWithdraw = async (reqId) => {
    if (window.confirm("Are you sure you want to withdraw your offer to help? This will alert the coordinator and reset the request's status so other local donors can be matched.")) {
      try {
        await donorService.respondToRequest(reqId, 'REJECTED');
        window.location.reload();
      } catch (err) {
        alert(err.message || 'Failed to withdraw request');
      }
    }
  };

  const getDonationStepsList = (req) => {
    const status = req.status;
    return [
      { label: "Request Accepted", isCompleted: true, desc: "You declared 'I Can Help'." },
      { 
        label: "Centre Coordination", 
        isCompleted: ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(status), 
        isActive: status === 'DONOR_RESPONDED',
        desc: "ASN Raju team is reviewing details."
      },
      { 
        label: "Visit Confirmed", 
        isCompleted: ['DONOR_CONFIRMED', 'FULFILLED'].includes(status), 
        isActive: status === 'COORDINATOR_ASSIGNED',
        desc: "Appointment confirmation."
      },
      { 
        label: "Medical Screening", 
        isCompleted: req.eligibility_status === 'ELIGIBLE' || status === 'FULFILLED', 
        isActive: status === 'DONOR_CONFIRMED' && req.eligibility_status !== 'ELIGIBLE',
        desc: "Clinical evaluation at centre."
      },
      { 
        label: "Donation Completed", 
        isCompleted: status === 'FULFILLED', 
        isActive: status === 'DONOR_CONFIRMED' && req.eligibility_status === 'ELIGIBLE',
        desc: "Fulfillment logged by staff."
      }
    ];
  };

  return (
    <div className="page-stack max-w-7xl">
      {/* Profile Completion Warning */}
      {isProfileIncomplete && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 font-sans">Complete your donor profile</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Some required contact or location details are missing. Complete your profile to improve local blood request matching.
            </p>
          </div>
          <Link
            to="/donor/profile"
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition shadow-sm whitespace-nowrap self-end sm:self-auto cursor-pointer"
          >
            Update My Details
          </Link>
        </div>
      )}

      {/* Donor Hero Motivation Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl flex-1 text-left">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red block">
              Blood Donation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {headline}
            </h2>
            <p className="text-sm sm:text-base text-slate-650 leading-relaxed">
              {supportingText}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {secondaryLine}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={ctaLink}
                className="rounded-lg bg-brand-red px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-red-dark text-center cursor-pointer block sm:inline-block w-full sm:w-auto"
              >
                {ctaText}
              </Link>
            </div>
          </div>

          <div className="w-full md:w-[440px] lg:w-[480px] flex justify-center items-center shrink-0">
            <div className="w-full aspect-[1.8/1] rounded-2xl overflow-hidden shadow-md border border-slate-100">
              <img
                src={donorHeroImage}
                alt="Person donating blood at a blood donation center"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Donation Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Donation Status</div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-sm font-bold text-slate-800">
                {isAvailable ? 'Ready to Donate' : 'Not Ready Right Now'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAvailable
                ? "You're currently available to help with blood requests. Actual medical screening happens at the blood centre."
                : "You're not currently receiving active donation alerts. You can still browse and share blood requests."}
            </p>
          </div>
          <Link
            to="/donor/availability"
            className="text-xs font-bold text-brand-red hover:underline shrink-0 self-start sm:self-auto"
          >
            Change Status →
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Summary Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Blood Group */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Blood Group</div>
          <div className="text-3xl font-extrabold text-brand-red">{profile?.blood_group || 'N/A'}</div>
          <div className="text-xxs text-slate-500 font-medium">Pending blood-centre verification</div>
        </div>

        {/* Total Donations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Donations Completed</div>
          <div className="text-3xl font-extrabold text-slate-900">{totalDonations}</div>
          <div className="text-xxs text-slate-500 font-medium">Verified completed donations</div>
        </div>

        {/* Matching Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Requests You Can Help With</div>
          <div className="text-3xl font-extrabold text-slate-900">{requests.length}</div>
          <div className="text-xxs text-slate-500 font-medium">Compatible matches</div>
        </div>

        {/* Last Donation Date */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Donation</div>
          <div className="text-sm font-bold text-slate-900 pt-2 pb-1">
            {profile?.last_donation_date
              ? new Date(profile.last_donation_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : 'No donation yet'}
          </div>
          <div className="text-xxs text-slate-500 font-medium">Minimum wait time: 3 months</div>
        </div>
      </div>

      {/* Main Dashboard Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3 pt-2">
        {/* Left Column: Blood Requests or Your Donation Journey */}
        <div className="lg:col-span-2 space-y-6">
          {activeRequest ? (
            /* ACTIVE DONATION JOURNEY CARD */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Your Donation Journey</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active coordination workflow for patient <strong>{activeRequest.patient_name}</strong></p>
                </div>
                <span className="text-lg font-black text-brand-red uppercase">{activeRequest.blood_group}</span>
              </div>

              {/* Progress Stepper Timeline (Responsive: Horizontal on Desktop, Vertical on Mobile) */}
              <div className="py-4">
                {/* Desktop Stepper */}
                <div className="hidden md:flex justify-between items-start relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
                  {getDonationStepsList(activeRequest).map((step, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center text-center px-2 z-10">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition duration-200 ${
                        step.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                        step.isActive ? 'bg-brand-red border-brand-red text-white animate-pulse' :
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {step.isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-xs mt-3 font-bold block ${step.isCompleted ? 'text-slate-800' : step.isActive ? 'text-brand-red' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[120px]">{step.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Mobile Stepper */}
                <div className="md:hidden space-y-6 relative pl-6 border-l border-slate-100 ml-4 py-2">
                  {getDonationStepsList(activeRequest).map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[38px] top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        step.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                        step.isActive ? 'bg-brand-red border-brand-red text-white animate-pulse' :
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {step.isCompleted ? '✓' : idx + 1}
                      </div>
                      <h4 className={`text-xs font-bold ${step.isCompleted ? 'text-slate-800' : step.isActive ? 'text-brand-red' : 'text-slate-400'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Context Card Details */}
              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Hospital</span>
                    <span className="font-semibold text-slate-800">{activeRequest.hospital_name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Location</span>
                    <span className="font-semibold text-slate-800">{activeRequest.location}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Required Units</span>
                    <span className="font-semibold text-slate-800">{activeRequest.required_units} Units</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Urgency</span>
                    <span className="font-semibold text-brand-red">{activeRequest.urgency_level}</span>
                  </div>
                </div>

                {/* Verified centre instructions banner */}
                {['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'].includes(activeRequest.status) && (
                  <div className="rounded-xl border border-emerald-250 bg-emerald-50/50 p-4 space-y-2 mt-4">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      📍 Scheduled Visit to ASN Raju Blood Bank
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Please visit the physical centre at Bhimavaram for screening and donation:
                    </p>
                    <div className="text-xs text-emerald-800 bg-white/60 p-3 rounded-lg border border-emerald-100 font-mono leading-relaxed">
                      D. No. 24-1-1, R.K. Plaza,<br />
                      (Sarovar Complex), Juvvalapalem Road,<br />
                      Bhimavaram - 534 202
                    </div>
                    <div className="pt-2 flex gap-3">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=ASN+Raju+Charitable+Trust+Blood+Bank+Bhimavaram"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-100 pt-4 text-xs">
                <button
                  onClick={() => handleWithdraw(activeRequest.id)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                >
                  Withdraw Offer to Help
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare(activeRequest)}
                    className="rounded-lg bg-brand-red px-4 py-2 font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
                  >
                    Share Request
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD REQUESTS LIST */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Blood Requests You Can Help With</h3>
                <Link to="/donor/requests" className="text-xxs font-bold text-brand-red hover:underline">
                  View All Blood Requests →
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-100 p-8 text-center text-xs text-slate-400 font-medium space-y-1">
                  <div className="font-bold text-slate-800">No blood requests near you right now.</div>
                  <div>We'll show relevant requests here when they become available.</div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {recentRequests.map((req) => {
                    const isAccepted = req.response_status === 'ACCEPTED';
                    const showDirections = isAccepted && ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(req.status);

                    return (
                      <div key={req.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-bold text-brand-red uppercase">{req.blood_group} · {req.required_units} Units Needed</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{req.hospital_name}</div>
                            <div className="text-xxs text-slate-500 mt-0.5">{req.location}</div>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-xxs text-slate-650 pt-1">
                          <div>
                            <strong className="text-slate-700">Needed by:</strong> {new Date(req.required_date_time).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                          <div>
                            <strong className="text-slate-700">Patient:</strong> {req.patient_name || 'Anonymous'} {req.patient_age ? `· ${req.patient_age} years` : ''}
                          </div>
                          <div className="sm:col-span-2">
                            <strong className="text-slate-700">For:</strong> {req.description || 'Surgery / Treatment'}
                          </div>
                        </div>

                        {/* Physical Confirmation address banner */}
                        {showDirections && (
                          <div className="rounded-xl border border-emerald-250 bg-emerald-50/50 p-4 space-y-2">
                            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              📍 Donation Visit Confirmed
                            </div>
                            <p className="text-xxs text-emerald-700 leading-relaxed">
                              Please visit <strong>ASN Raju Charitable Trust Blood Bank & Components</strong> in Bhimavaram for the donation process.
                            </p>
                            <div className="text-xxs text-emerald-800 bg-white/60 p-2.5 rounded-lg border border-emerald-100 font-mono">
                              D. No. 24-1-1, R.K. Plaza,<br />
                              (Sarovar Complex), Juvvalapalem Road,<br />
                              Bhimavaram - 534 202
                            </div>
                            <a
                              href="https://www.google.com/maps/search/?api=1&query=ASN+Raju+Charitable+Trust+Blood+Bank+Bhimavaram"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xxs font-bold text-white hover:bg-emerald-700 transition shadow-sm mt-1"
                            >
                              Get Directions →
                            </a>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xxs text-slate-500">
                          <span className="font-medium">Urgency: <strong className="text-brand-red font-semibold">{req.urgency_level}</strong></span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleShare(req)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-650 hover:bg-slate-50 transition cursor-pointer"
                            >
                              Share
                            </button>
                            <Link
                              to="/donor/requests"
                              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 font-semibold transition"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Recent Updates & Recent Donations */}
        <div className="space-y-6">
          {/* Recent Updates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Updates</h3>
              <Link to="/donor/notifications" className="text-xxs font-bold text-brand-red hover:underline">
                View All Updates →
              </Link>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-100 p-8 text-center text-xs text-slate-400 font-medium space-y-1">
                <div className="font-bold text-slate-800">You're all caught up.</div>
                <div>New blood request and account updates will appear here.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((item) => {
                  const isRead = item.status === 'READ';
                  return (
                    <div key={item.id} className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{item.title}</span>
                        {!isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-red"></span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xxs line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Donations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Donations</h3>
              <Link to="/donor/donation-history" className="text-xxs font-bold text-brand-red hover:underline">
                View Donation History →
              </Link>
            </div>

            {recentHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-100 p-8 text-center text-xs text-slate-400 font-medium space-y-1">
                <div className="font-bold text-slate-800">No donations recorded yet.</div>
                <div>Your completed donations will appear here.</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {recentHistory.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <div className="font-bold text-slate-800">
                        {new Date(item.donation_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                      <div className="text-slate-400 text-xxs mt-0.5">
                        ASN Raju Blood Centre, Bhimavaram
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xxs font-bold text-emerald-700 border border-emerald-100">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}