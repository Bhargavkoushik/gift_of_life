import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';

export default function DonorRequests() {
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [requests, setRequests] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expandedFormRequestIds, setExpandedFormRequestIds] = useState(new Set());

  const handleICanHelpClick = (reqId) => {
    setExpandedFormRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) {
        next.delete(reqId);
      } else {
        next.add(reqId);
      }
      return next;
    });
  };

  const loadRequests = async () => {
    try {
      const data = await donorService.getMatchingRequests();
      setRequests(data || []);
    } catch (err) {
      setErrorMsg('Failed to load blood requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResponse = async (requestId, status) => {
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await donorService.respondToRequest(requestId, status, 'Responded via donor workspace');
      if (status === 'ACCEPTED') {
        setSuccessMsg("Thank you for offering to help. Your response has been sent to the ASN Raju coordinator. They will contact you to confirm the donation.");
      } else {
        setSuccessMsg(`You have successfully declined the blood request.`);
      }
      await loadRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit response. Please try again.';
      setErrorMsg(msg);
    } finally {
      setActioning(false);
    }
  };

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

  const getDonationSteps = (req) => {
    const status = req.status;
    return [
      { label: "You offered to help", isCompleted: true },
      { 
        label: "Coordinator will contact you", 
        isCompleted: ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(status), 
        isActive: status === 'DONOR_RESPONDED'
      },
      { 
        label: "Visit confirmed", 
        isCompleted: ['DONOR_CONFIRMED', 'FULFILLED'].includes(status), 
        isActive: status === 'COORDINATOR_ASSIGNED'
      },
      { 
        label: "Visit to ASN Raju Blood Centre", 
        isCompleted: ['DONOR_CONFIRMED', 'FULFILLED'].includes(status), 
        isActive: status === 'DONOR_CONFIRMED' && req.eligibility_status !== 'ELIGIBLE' && status !== 'FULFILLED'
      },
      { 
        label: "Medical screening", 
        isCompleted: req.eligibility_status === 'ELIGIBLE' || status === 'FULFILLED', 
        isActive: status === 'DONOR_CONFIRMED' && req.eligibility_status !== 'ELIGIBLE'
      },
      { 
        label: "Donation completed", 
        isCompleted: status === 'FULFILLED', 
        isActive: status === 'DONOR_CONFIRMED' && req.eligibility_status === 'ELIGIBLE'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Blood Requests"
        description="Browse active blood requests you may be able to help with."
      />

      <div className="space-y-4 max-w-3xl">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-855 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <div className="text-sm font-bold text-slate-900 mb-1 font-sans">No matching blood requests right now.</div>
            <div className="text-xs">We will alert you when compatible needs are registered in the blood bank.</div>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((req) => {
              const dateStr = req.required_date_time
                ? new Date(req.required_date_time).toLocaleDateString(undefined, {
                    dateStyle: 'medium'
                  })
                : 'N/A';

              const isEmergency = req.urgency_level === 'EMERGENCY';
              const isUrgent = req.urgency_level === 'URGENT';
              const isAccepted = req.response_status === 'ACCEPTED';
              const steps = getDonationSteps(req);
              const showDirections = isAccepted && ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(req.status);

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
                    isEmergency ? 'border-l-4 border-l-brand-red' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Blood Request
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        Required Group: {req.blood_group}
                      </h3>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          isEmergency
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : isUrgent
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {req.urgency_level}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                        {req.required_units} Units Needed
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
                    <div>
                      <strong className="text-slate-800">Hospital:</strong> {req.hospital_name}
                    </div>
                    <div>
                      <strong className="text-slate-800">Needed by:</strong> {dateStr}
                    </div>
                    <div>
                      <strong className="text-slate-800">Location:</strong> {req.location}
                    </div>
                    <div>
                      <strong className="text-slate-800">Hospital Address:</strong> {req.hospital_address}
                    </div>
                    <div>
                      <strong className="text-slate-800">Patient:</strong> {req.patient_name || 'Anonymous'}
                    </div>
                    {req.patient_age && (
                      <div>
                        <strong className="text-slate-800">Age:</strong> {req.patient_age} years
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <strong className="text-slate-800">For:</strong> {req.description || 'Surgery / Medical Treatment'}
                    </div>
                  </div>

                  {/* Progress tracker timeline */}
                  {isAccepted && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Donation Progress</div>
                      <div className="relative pl-4 border-l border-slate-200 ml-1.5 space-y-3 py-1 text-xxs font-medium text-slate-650">
                        {steps.map((step, idx) => (
                          <div key={idx} className="relative flex items-center gap-2">
                            <span className={`absolute -left-[21.5px] h-3 w-3 rounded-full border flex items-center justify-center text-[8px] ${
                              step.isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white font-bold'
                                : step.isActive
                                ? 'bg-brand-red border-brand-red text-white animate-pulse'
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {step.isCompleted ? '✓' : step.isActive ? '●' : ''}
                            </span>
                            <span className={`${
                              step.isCompleted
                                ? 'text-slate-800 font-semibold'
                                : step.isActive
                                ? 'text-brand-red font-bold'
                                : 'text-slate-450'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request-specific Google Form details */}
                  {expandedFormRequestIds.has(req.id) && !isAccepted && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                      <div className="pt-2 flex flex-col gap-2">
                        <p className="text-[11px] text-slate-550 leading-relaxed font-sans select-none">
                          Please complete the donor details form to help our coordinator verify your eligibility:
                        </p>
                        <a
                          href={`https://docs.google.com/forms/d/e/1FAIpQLSfS2_x1c7a8bZ9fX09q2o3w5e6r7t8y9u0i1o2/viewform?entry.123456789=${encodeURIComponent(
                            `GL-${new Date(req.created_at || Date.now()).getFullYear()}-${req.id.slice(0, 8).toUpperCase()}`
                          )}&entry.987654321=${encodeURIComponent(req.donor_token || 'ANONYMOUS')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-brand-red px-3 py-2 text-xxs font-bold text-white hover:bg-brand-red-dark transition shadow-sm select-none"
                        >
                          Complete Donor Form →
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Physical visit instructions */}
                  {showDirections && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/55 p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        📍 Donation Visit Confirmed
                      </div>
                      <p className="text-xxs text-emerald-755 leading-relaxed">
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

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4">
                    {req.response_status === 'ACCEPTED' && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        ✓ You offered to help
                      </span>
                    )}
                    {req.response_status === 'REJECTED' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        Declined
                      </span>
                    )}

                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => handleShare(req)}
                        disabled={actioning}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-55 transition cursor-pointer disabled:bg-slate-50"
                      >
                        Share
                      </button>

                      {req.response_status === 'NO_RESPONSE' && (
                        <>
                          <button
                            onClick={() => handleICanHelpClick(req.id)}
                            disabled={actioning}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition cursor-pointer ${
                              expandedFormRequestIds.has(req.id)
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-brand-red text-white hover:bg-brand-red-dark'
                            }`}
                          >
                            {expandedFormRequestIds.has(req.id) ? 'Collapse Form' : 'I Can Help'}
                          </button>
                          <button
                            onClick={() => handleResponse(req.id, 'REJECTED')}
                            disabled={actioning}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-55 transition cursor-pointer disabled:bg-slate-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}