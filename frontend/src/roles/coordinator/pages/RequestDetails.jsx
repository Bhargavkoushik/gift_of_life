import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import {
  getCoordinatorRequestDetails,
  coordinateRequest,
  confirmVisit,
  recordScreening,
  completeDonationByCoordinator
} from '../../../services/coordinatorService';

export default function CoordinatorRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromRoute = location.state?.from || '/coordinator/requests';
  const backLabel = location.state?.label || 'Assigned Requests';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmCompleteDonorId, setConfirmCompleteDonorId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Screening form state
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('ELIGIBLE');
  const [deferredUntil, setDeferredUntil] = useState('');

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await getCoordinatorRequestDetails(id);
      setData(res);
      if (res.responses && res.responses.length > 0) {
        setSelectedDonorId(res.responses[0].donor_profile_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCoordinate = async () => {
    setActionLoading(true);
    try {
      await coordinateRequest(id);
      await loadDetails();
    } catch (err) {
      setError(err.message || 'Failed to start coordination');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmVisit = async () => {
    setActionLoading(true);
    try {
      await confirmVisit(id);
      await loadDetails();
    } catch (err) {
      setError(err.message || 'Failed to confirm visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScreeningSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonorId) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await recordScreening(id, selectedDonorId, screeningStatus, deferredUntil || null);
      await loadDetails();
      setSuccessMessage('Medical screening outcome recorded successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to record screening');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDonation = (donorProfileId) => {
    setConfirmCompleteDonorId(donorProfileId);
  };

  const executeCompleteDonation = async () => {
    if (!confirmCompleteDonorId) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await completeDonationByCoordinator(id, confirmCompleteDonorId);
      setConfirmCompleteDonorId(null);
      setSuccessMessage('Donation successfully logged and request closed!');
      setTimeout(() => {
        setSuccessMessage(null);
        navigate(fromRoute);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to complete donation');
      setConfirmCompleteDonorId(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-500 font-medium">Loading details...</div>;
  if (!data) return <div className="text-center py-10 text-rose-500 font-medium">Request details not found.</div>;

  const { request, responses } = data;

  return (
    <div className="page-stack">
      <div>
        <button
          onClick={() => navigate(fromRoute)}
          className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
        >
          ← Back to {backLabel}
        </button>
        <PageHeader
          title={`Coordinate Request for ${request.patient_name}`}
          description={`Track stages, manage donor check-ins, and record clinical outcomes.`}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 select-none animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 select-none animate-fade-in">
          ✓ {successMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 mt-6">
        {/* LEFT COLUMN: REQUEST DETAILS & RESPONSES */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Request Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Patient Name</span>
                <span className="font-semibold text-slate-800">{request.patient_name}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Blood Group</span>
                <span className="font-semibold text-blue-600 text-lg">{request.blood_group}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Hospital Name</span>
                <span className="text-slate-700">{request.hospital_name}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Hospital Address</span>
                <span className="text-slate-700">{request.hospital_address}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Urgency Level</span>
                <span className="text-slate-700 font-semibold">{request.urgency_level}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</span>
                <span className="text-blue-600 font-semibold uppercase">{request.status.replace('_', ' ')}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Matched Donor Responses</h3>
            {responses.length === 0 ? (
              <p className="text-slate-500 text-sm">No donors have responded to this request yet.</p>
            ) : (
              <div className="space-y-4">
                {responses.map((resp) => (
                  <div key={resp.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{resp.donor_name}</h4>
                      <p className="text-xs text-slate-500">Phone: {resp.donor_phone} | Email: {resp.donor_email}</p>
                      <p className="text-xs text-slate-400 mt-1">Status: <span className="font-semibold text-blue-600">{resp.eligibility_status}</span></p>
                      {resp.notes && <p className="text-xs italic text-slate-500 mt-1">"Notes: {resp.notes}"</p>}
                    </div>
                    {request.status === 'DONOR_CONFIRMED' && resp.eligibility_status === 'ELIGIBLE' && (
                      <button
                        onClick={() => handleCompleteDonation(resp.donor_profile_id)}
                        disabled={actionLoading}
                        className="mt-4 md:mt-0 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                      >
                        Record Successful Donation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Coordination Controls</h3>

            {request.status === 'DONOR_RESPONDED' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  A donor has responded to this request. Start matching coordination to show progress updates.
                </p>
                <button
                  onClick={handleCoordinate}
                  disabled={actionLoading}
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Start Coordination'}
                </button>
              </div>
            )}

            {request.status === 'COORDINATOR_ASSIGNED' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Confirm the donor visit to ASN Raju Blood Centre in Bhimavaram. This updates the donor's timeline map directions.
                </p>
                <button
                  onClick={handleConfirmVisit}
                  disabled={actionLoading}
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Donor Visit'}
                </button>
              </div>
            )}

            {request.status === 'DONOR_CONFIRMED' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">1. Record Medical Screening Outcome</h4>
                  <form onSubmit={handleScreeningSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Donor</label>
                      <select
                        value={selectedDonorId}
                        onChange={(e) => setSelectedDonorId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none"
                      >
                        {responses.map((r) => (
                          <option key={r.id} value={r.donor_profile_id}>{r.donor_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Outcome</label>
                      <select
                        value={screeningStatus}
                        onChange={(e) => setScreeningStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none"
                      >
                        <option value="ELIGIBLE">Eligible (Cleared)</option>
                        <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
                        <option value="NOT_ELIGIBLE">Not Eligible (Permanently Deferred)</option>
                      </select>
                    </div>

                    {screeningStatus === 'TEMPORARILY_DEFERRED' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Deferred Until</label>
                        <input
                          type="date"
                          value={deferredUntil}
                          onChange={(e) => setDeferredUntil(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading || !selectedDonorId}
                      className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                    >
                      {actionLoading ? 'Saving...' : 'Submit Screening Outcome'}
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">2. Record Donation Details</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    If screening passed, click the green "Record Successful Donation" button next to the donor details above.
                  </p>
                </div>
              </div>
            )}

            {request.status === 'FULFILLED' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-750 font-bold block">Fulfillment Complete</span>
                <p className="text-xs text-emerald-650 mt-1">The blood request has been successfully resolved.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* CONFIRM DONATION COMPLETION MODAL */}
      {confirmCompleteDonorId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-slate-900 select-none">
              Confirm Donation Completion
            </h3>
            
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              Are you sure you want to mark this donation as completed? This will finalize the request and mark the donor as unavailable.
            </p>
            
            <div className="flex justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setConfirmCompleteDonorId(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCompleteDonation}
                disabled={actionLoading}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                {actionLoading ? 'Completing...' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}