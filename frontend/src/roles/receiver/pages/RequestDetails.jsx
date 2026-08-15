import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function RequestDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const loadDetails = async () => {
    try {
      const details = await receiverService.getRequestDetails(id);
      setData(details);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await receiverService.cancelRequest(id);
      setShowCancelConfirm(false);
      loadDetails();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  const getFriendlyStatus = (status) => {
    const mapping = {
      'PENDING': 'Coordinator Reviewing',
      'APPROVED': 'Coordinator Reviewing',
      'DONORS_ALERTED': 'Searching Donors',
      'DONOR_RESPONDED': 'Donor Response Received',
      'COORDINATOR_ASSIGNED': 'Coordinator is coordinating',
      'DONOR_CONFIRMED': 'Visit Confirmed',
      'FULFILLED': 'Request Fulfilled',
      'CANCELLED': 'Request Cancelled',
      'REJECTED': 'Request Denied',
      'NO_DONOR_FOUND': 'No Donor Found'
    };
    return mapping[status] || status;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
      case 'DONORS_ALERTED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'DONOR_RESPONDED':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'COORDINATOR_ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DONOR_CONFIRMED':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="page-stack max-w-4xl">
        <PageHeader title="Request Details" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      </div>
    );
  }

  const { request, donorResponsesCount, milestones } = data;
  const isCancellable = !['FULFILLED', 'CANCELLED', 'REJECTED'].includes(request.status);

  return (
    <div className="page-stack max-w-4xl relative">
      <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
        <Link to="/receiver/requests" className="hover:text-brand-red">Requests</Link>
        <span>/</span>
        <span className="text-slate-600">Details</span>
      </div>

      <PageHeader
        title={`Request for Patient: ${request.patient_name}`}
        description="Verify details, audit coordinator updates, and review physical visit logs."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: REQUEST DETAILS */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex gap-4 items-center">
                <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg font-black shrink-0 font-sans">
                  {request.blood_group}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Patient: {request.patient_name}</h3>
                  <span className="text-slate-400 font-medium text-xxs block">Required Units: {request.required_units} Units</span>
                </div>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold border uppercase ${getStatusStyle(request.status)}`}>
                {getFriendlyStatus(request.status)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xxs leading-relaxed font-semibold text-slate-500">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Required Before</span>
                <span className="text-slate-800">
                  {new Date(request.required_date_time).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} · {new Date(request.required_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Urgency Level</span>
                <span className="text-slate-800 uppercase">{request.urgency_level}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Hospital Name</span>
                <span className="text-slate-800">{request.hospital_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">City/Town Location</span>
                <span className="text-slate-800">{request.location}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Hospital Address</span>
                <span className="text-slate-800">{request.hospital_address}</span>
              </div>
              {request.description && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Case Details / Medical Purpose</span>
                  <span className="text-slate-800 leading-normal block font-medium">{request.description}</span>
                </div>
              )}
            </div>

            {/* CANCELLATION BOX */}
            {isCancellable && (
              <div className="border-t border-slate-100 pt-4 flex justify-end">
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 text-xxs font-bold transition cursor-pointer"
                  >
                    Cancel Blood Request
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl w-full flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-left">
                      <strong className="text-rose-800 text-xxs font-bold block">Cancel Blood Request?</strong>
                      <span className="text-slate-500 text-xxs font-semibold">This request will no longer be active or matched.</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={cancelling}
                        className="rounded-lg bg-white border border-slate-200 px-3.5 py-1.5 text-xxs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Keep Request
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xxs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REQUEST JOURNEY STEPS */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-2">
              Request Journey
            </h3>

            {/* TIMELINE LIST */}
            <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-1 select-none">
              {milestones.map((m) => (
                <div key={m.key} className="relative">
                  <span className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center text-white ${
                    m.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'
                  }`}>
                    {m.completed && (
                      <span className="text-[10px] font-bold">✓</span>
                    )}
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold leading-normal ${m.completed ? 'text-slate-800' : 'text-slate-350'}`}>
                      {m.label}
                    </h4>
                    {m.completed && m.timestamp && (
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5">
                        {new Date(m.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* PRIVACY COORDINATION DISCLAIMER */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xxs font-semibold leading-relaxed text-slate-500 space-y-2 select-none">
              <span className="text-slate-400 block uppercase font-bold text-[8px]">Request Status Update</span>
              <p className="text-slate-700 font-medium">
                {request.status === 'FULFILLED' ? (
                  "Donation completed for this request."
                ) : ['DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'].includes(request.status) ? (
                  "Your request is being coordinated. A donor has offered to help, and the Trust team is arranging the donation."
                ) : ['CANCELLED', 'REJECTED'].includes(request.status) ? (
                  "This request is closed or cancelled."
                ) : (
                  "No donor has accepted this request yet. We are continuing to look for compatible donors."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}