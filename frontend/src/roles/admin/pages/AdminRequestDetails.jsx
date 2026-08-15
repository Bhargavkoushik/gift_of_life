import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function AdminRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.getRequestDetails(id);
      setData(res);
    } catch (err) {
      console.error('[AdminRequestDetails] Error loading details:', err);
      setErrorMsg(`Unable to load request details. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCoordinatorsList = async () => {
    try {
      const res = await adminService.getActiveCoordinators();
      setCoordinators(res.coordinators || []);
    } catch (err) {
      console.error('Error fetching coordinators list:', err);
    }
  };

  useEffect(() => {
    loadDetails();
    loadCoordinatorsList();
  }, [id]);

  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    if (!selectedCoordinatorId) return;
    setAssignLoading(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await adminService.assignRequestCoordinator(id, selectedCoordinatorId);
      setActionSuccessMsg(res.message || 'Coordinator successfully assigned.');
      setShowAssignModal(false);
      loadDetails();
    } catch (err) {
      console.error('Error assigning coordinator:', err);
      setErrorMsg(`Failed to assign coordinator. ${err.response?.data?.message || err.message}`);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this blood request? This will deactivate any assignments and is irreversible.')) {
      return;
    }
    setCancelLoading(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await adminService.cancelBloodRequest(id);
      setActionSuccessMsg(res.message || 'Blood request cancelled successfully.');
      loadDetails();
    } catch (err) {
      console.error('Error cancelling request:', err);
      setErrorMsg(`Failed to cancel request. ${err.response?.data?.message || err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 font-sans text-xs">
        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-brand-red" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading request details...
      </div>
    );
  }

  if (!data || !data.request) {
    return (
      <div className="page-stack max-w-5xl">
        <button onClick={() => navigate('/admin/requests')} className="text-xs font-bold text-slate-500 hover:text-brand-red mb-4">
          ← Back to Requests
        </button>
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ Blood request not found.
        </div>
      </div>
    );
  }

  const { request, assignment, compatibleDonors } = data;

  const getUrgencyBadgeStyle = (level) => {
    switch (level) {
      case 'EMERGENCY':
        return 'bg-rose-50 text-rose-700 border-rose-150 font-bold';
      case 'URGENT':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getFriendlyStatus = (reqStatus) => {
    const mapping = {
      'PENDING': 'Awaiting Approval',
      'APPROVED': 'Approved / Sourcing',
      'DONORS_ALERTED': 'Donors Alerted',
      'DONOR_RESPONDED': 'Donor Accepted',
      'COORDINATOR_ASSIGNED': 'Coordinator Assigned',
      'DONOR_CONFIRMED': 'In Coordination',
      'FULFILLED': 'Completed',
      'CANCELLED': 'Cancelled',
      'REJECTED': 'Rejected',
      'NO_DONOR_FOUND': 'No Donor Found'
    };
    return mapping[reqStatus] || reqStatus;
  };

  const isTerminal = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'].includes(request.status);

  // Timeline computation
  const timelineMilestones = [
    { label: 'Created', completed: true },
    { label: 'Donors Notified', completed: ['APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) },
    { label: 'Donor Responded', completed: ['DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) },
    { label: 'Coordinator Working', completed: ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) },
    { label: 'Visit Confirmed', completed: ['DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) },
    { label: 'Donor Arrived', completed: ['DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) },
    { 
      label: 'Screening', 
      completed: request.status === 'FULFILLED' || (compatibleDonors && compatibleDonors.some(d => d.availability_status === 'AVAILABLE' || d.response_status === 'ACCEPTED')) 
    },
    { label: 'Donation Completed', completed: request.status === 'FULFILLED' },
    { label: 'Fulfilled', completed: request.status === 'FULFILLED' }
  ];

  const getMilestoneState = (milestone, idx) => {
    if (request.status === 'CANCELLED' || request.status === 'REJECTED') {
      return 'terminal';
    }
    if (milestone.completed) {
      return 'completed';
    }
    const prevCompleted = idx === 0 || timelineMilestones[idx - 1].completed;
    if (prevCompleted) {
      return 'current';
    }
    return 'pending';
  };

  return (
    <div className="page-stack max-w-5xl relative select-none">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/admin/requests')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red transition cursor-pointer select-none mb-4 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Requests
      </button>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      )}
      {actionSuccessMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100">
          ✓ {actionSuccessMsg}
        </div>
      )}

      {/* TERMINAL STATUS BANNER */}
      {isTerminal && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          request.status === 'FULFILLED'
            ? 'bg-emerald-50 border-emerald-150 text-emerald-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm">
            {request.status === 'FULFILLED' ? '✓' : '✖'}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">Request is Closed</h4>
            <p className="text-[11px] opacity-80 mt-0.5">
              This request was resolved as <strong>{getFriendlyStatus(request.status)}</strong> on{' '}
              {new Date(request.closed_at || request.created_at).toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              REQ-{request.id.substring(0, 8).toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] ${getUrgencyBadgeStyle(request.urgency_level)}`}>
              {request.urgency_level}
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-800 mt-1">Patient: {request.patient_name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(request.created_at).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-2">
            <span className="text-sm font-black text-brand-red">{request.blood_group}</span>
            <div className="w-px h-5 bg-rose-200" />
            <span className="text-xs font-bold text-slate-700">{request.required_units} Units</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
            <span className="text-xs font-bold text-slate-800">{getFriendlyStatus(request.status)}</span>
          </div>
        </div>
      </div>

      {/* TIMELINE TRACKER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-6">Request Workflow Timeline</h3>

        <div className="relative flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-2">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute left-4 right-4 top-4.5 h-0.5 bg-slate-100 -z-10" />

          {timelineMilestones.map((milestone, idx) => {
            const state = getMilestoneState(milestone, idx);
            let circleColor = 'border-slate-200 bg-white text-slate-400';
            let labelColor = 'text-slate-400';

            if (state === 'completed') {
              circleColor = 'border-emerald-600 bg-emerald-50 text-emerald-700';
              labelColor = 'text-slate-800 font-bold';
            } else if (state === 'current') {
              circleColor = 'border-brand-red bg-rose-50 text-brand-red animate-pulse';
              labelColor = 'text-brand-red font-black';
            } else if (state === 'terminal') {
              circleColor = 'border-slate-300 bg-slate-100 text-slate-500';
              labelColor = 'text-slate-500';
            }

            return (
              <div key={milestone.label} className="flex-1 flex md:flex-col items-center gap-3 md:gap-2 z-10">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shadow-sm ${circleColor}`}>
                  {state === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="text-left md:text-center">
                  <span className={`text-[10px] block font-sans tracking-wide uppercase ${labelColor}`}>
                    {milestone.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL BLOCKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {/* Patient & Hospital Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Patient & Location Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Patient Name</span>
                <strong className="text-slate-800 font-bold">{request.patient_name}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Required Date & Time</span>
                <strong className="text-slate-800 font-bold">{new Date(request.required_date_time).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Hospital Name</span>
                <strong className="text-slate-850 font-bold">{request.hospital_name}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Hospital Location</span>
                <strong className="text-slate-850 font-bold">{request.location}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Hospital Address</span>
                <p className="text-slate-700 font-medium">{request.hospital_address}</p>
              </div>
              {request.description && (
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Additional Notes</span>
                  <p className="text-slate-700 font-medium italic bg-slate-25 p-2.5 rounded-lg border border-slate-100">
                    "{request.description}"
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Receiver Account Contact</h4>
              <div className="flex justify-between items-center bg-slate-25 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-850 block">{request.receiver_name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Registered Receiver Profile</span>
                </div>
                <a href={`tel:${request.receiver_phone}`} className="text-xs font-bold text-brand-red hover:underline">
                  📞 {request.receiver_phone}
                </a>
              </div>
            </div>
          </div>

          {/* Compatible Donor matches log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-850">Compatible Donors Match Logs</h3>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-rose-50 text-brand-red border border-rose-100 rounded-full">
                {request.blood_group} Target Matches
              </span>
            </div>

            {compatibleDonors.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No matching {request.blood_group} active donors found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Donor</th>
                      <th className="pb-2">Area / Location</th>
                      <th className="pb-2 text-center">Availability</th>
                      <th className="pb-2 text-center">Match Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {compatibleDonors.map((d) => (
                      <tr key={d.donor_profile_id}>
                        <td className="py-2.5">
                          <strong className="text-slate-800 font-bold block">{d.donor_name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{d.donor_phone}</span>
                        </td>
                        <td className="py-2.5 text-slate-650 font-medium">
                          {d.area}, {d.district}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] ${
                            d.availability_status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {d.availability_status === 'AVAILABLE' ? 'Ready to Donate' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${
                            d.response_status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : d.response_status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-150'
                              : 'bg-slate-50 text-slate-500 border-slate-150'
                          }`}>
                            {d.response_status || 'NOTIFIED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Coordinator Info & Physical Coordination */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Responsible Coordinator</h3>

            {assignment ? (
              <div className="space-y-3">
                <div className="bg-rose-25 border border-rose-100/50 p-4 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assigned Agent</span>
                  <strong className="text-sm font-extrabold text-slate-800">{assignment.coordinator_name}</strong>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <span>📞</span>
                      <a href={`tel:${assignment.coordinator_phone}`} className="hover:underline">{assignment.coordinator_phone}</a>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span>✉</span>
                      <a href={`mailto:${assignment.coordinator_email}`} className="hover:underline truncate">{assignment.coordinator_email}</a>
                    </p>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assignment Date</span>
                  <span className="text-slate-800 font-semibold">
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-25 rounded-xl border border-slate-150">
                <p className="text-xs text-slate-500">No coordinator assigned yet.</p>
              </div>
            )}

            {!isTerminal && (
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="w-full rounded-lg bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white py-2.5 transition cursor-pointer"
              >
                {assignment ? 'Reassign Coordinator' : 'Assign Coordinator'}
              </button>
            )}
          </div>

          {/* Physical Coordination Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Physical Location</h3>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-850 font-bold block">ASN Raju Blood Centre</strong>
                <p className="text-slate-600 mt-1 text-[11px]">
                  Bhimavaram Trust Center<br />
                  West Godavari District, AP
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Visit Status</span>
                <strong className="text-slate-850 font-bold block">
                  {request.status === 'DONOR_CONFIRMED' ? 'Visit Scheduled at Center' : getFriendlyStatus(request.status)}
                </strong>
              </div>
            </div>
          </div>

          {/* Admin Override Controls */}
          {!isTerminal && (
            <div className="rounded-2xl border border-rose-100 bg-rose-25/30 p-6 space-y-4">
              <h3 className="text-xs font-bold text-rose-800">Danger Zone Override</h3>
              <p className="text-[10px] text-slate-500">
                As administrator, you can cancel this request if it is duplicate or cannot be fulfilled.
              </p>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="w-full rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-brand-red py-2.5 transition cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN COORDINATOR MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-800">Assign Operations Coordinator</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-sm font-bold"
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleAssignCoordinator} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Select Trust Coordinator
                </label>
                <select
                  required
                  value={selectedCoordinatorId}
                  onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-700 bg-white"
                >
                  <option value="">-- Choose Coordinator --</option>
                  {coordinators.map((c) => (
                    <option key={c.coordinator_profile_id} value={c.coordinator_profile_id}>
                      {c.name} ({c.area} - {c.availability_status.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-25 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500">
                💡 Coordinators will be notified to start physical follow-up and coordinate donor visits to ASN Raju Blood Centre.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedCoordinatorId}
                  className="rounded-lg bg-brand-red hover:bg-brand-red-dark px-4 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
