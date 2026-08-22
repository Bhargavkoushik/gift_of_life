import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';
import { useAuth } from '../../../context/AuthContext';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await bloodBankAdminService.getRequestDetails(id);
      setRequest(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCancelRequest = async () => {
    setCancelLoading(true);
    try {
      await bloodBankAdminService.cancelRequest(id);
      setShowCancelModal(false);
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel request.');
      setShowCancelModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const getFriendlyStatus = (status) => {
    const mapping = {
      'PENDING': 'Awaiting Action',
      'APPROVED': 'Approved',
      'DONORS_ALERTED': 'Searching Donors',
      'DONOR_RESPONDED': 'Donor Responded',
      'COORDINATOR_ASSIGNED': 'Coordinating',
      'DONOR_CONFIRMED': 'Visit Confirmed',
      'FULFILLED': 'Fulfilled',
      'CANCELLED': 'Cancelled',
      'REJECTED': 'Denied',
      'NO_DONOR_FOUND': 'No Donor Found'
    };
    return mapping[status] || status;
  };

  const getStatusBadgeStyle = (status) => {
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
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_DONOR_FOUND':
        return 'bg-rose-50 text-rose-700 border-rose-100';
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

  if (error || !request) {
    return (
      <div className="page-stack max-w-4xl">
        <PageHeader title="Request Tracker Details" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error || 'Request details not found.'}
        </div>
        <button
          onClick={() => navigate('/blood-bank-admin/requests')}
          className="mt-4 inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          ← Back to Requests
        </button>
      </div>
    );
  }

  const isCreator = request.created_by_user_id === user?.id;
  const isCancellable = ['PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'].includes(request.status);

  return (
    <div className="page-stack max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/blood-bank-admin/requests')}
          className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
        >
          ← Back to Requests
        </button>
        <PageHeader
          title={`Request for ${request.patient_name}`}
          description="Detailed overview of status and coordination logs."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Patient & Clinical Info
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed font-semibold text-slate-700">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Patient Name</span>
                <span className="text-slate-900 text-sm font-extrabold">{request.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Blood Group Required</span>
                <span className="text-rose-600 text-lg font-black">{request.blood_group}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Required Units</span>
                <span className="text-slate-900">{request.required_units} Units</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Urgency Level</span>
                <span className={`uppercase font-bold ${request.urgency_level === 'EMERGENCY' ? 'text-rose-600' : request.urgency_level === 'URGENT' ? 'text-amber-600' : 'text-slate-500'}`}>
                  {request.urgency_level}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-3">
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Hospital Venue</span>
                <span className="text-slate-900">{request.hospital_name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Hospital Address</span>
                <span className="text-slate-550">{request.hospital_address}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Location City/Town</span>
                <span className="text-slate-900">{request.location}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Target DateTime</span>
                <span className="text-slate-900">{new Date(request.required_date_time).toLocaleString()}</span>
              </div>
              {request.description && (
                <div className="col-span-2 border-t border-slate-100 pt-3">
                  <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Case Description</span>
                  <span className="text-slate-600 italic">"{request.description}"</span>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="md:col-span-1 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Status & Owner
            </h3>

            <div className="space-y-3 text-xs leading-relaxed font-semibold text-slate-650">
              <div>
                <span className="text-slate-450 block uppercase font-bold text-[9px]">Request Status</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase mt-1 ${getStatusBadgeStyle(request.status)}`}>
                  {getFriendlyStatus(request.status)}
                </span>
              </div>

              <div>
                <span className="text-slate-455 block uppercase font-bold text-[9px]">Creator Identity</span>
                <span className="text-slate-900 block mt-0.5">{request.creator_name}</span>
                <span className="text-slate-400 text-xxs block font-medium">({request.created_by_role.replace('_', ' ')})</span>
              </div>

              {request.receiver_name && (
                <div>
                  <span className="text-slate-455 block uppercase font-bold text-[9px]">On Behalf of Receiver</span>
                  <span className="text-slate-900 block mt-0.5">{request.receiver_name}</span>
                </div>
              )}

              {isCreator && isCancellable && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 text-xxs transition duration-150 cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-slate-900 select-none">
              Cancel Blood Request
            </h3>
            
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              Are you sure you want to cancel this blood request? This action cannot be undone and will stop active donor coordination.
            </p>
            
            <div className="flex justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
