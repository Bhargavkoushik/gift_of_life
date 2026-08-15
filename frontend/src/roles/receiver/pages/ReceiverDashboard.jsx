import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function ReceiverDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await receiverService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (error) {
    return (
      <div className="page-stack max-w-4xl">
        <PageHeader title="Receiver Dashboard" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const { metrics, primaryRequest, recentRequests } = stats;

  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="Receiver Dashboard"
        description="Monitor status updates, verify donor feedback coordinates, and track active request cycles."
      />

      {/* METRICS ROW */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Requests</span>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.activeRequests}</div>
          <span className="text-xxs text-slate-400 font-medium">Currently in system review</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Being Coordinated</span>
          <div className="text-2xl font-extrabold text-blue-600">{metrics.coordinatingRequests}</div>
          <span className="text-xxs text-slate-400 font-medium">Assigned staff coordination</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Donor Responses</span>
          <div className="text-2xl font-extrabold text-amber-600">{metrics.donorResponses}</div>
          <span className="text-xxs text-slate-400 font-medium">Matches ready to help</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Fulfilled Requests</span>
          <div className="text-2xl font-extrabold text-emerald-600">{metrics.fulfilledRequests}</div>
          <span className="text-xxs text-slate-400 font-medium">Donations successfully recorded</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT/CENTER: PRIMARY ACTIVE REQUEST */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-3 flex justify-between items-center">
              <span>Active Request Status</span>
              {primaryRequest && (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-bold border ${getStatusBadgeStyle(primaryRequest.status)}`}>
                  {getFriendlyStatus(primaryRequest.status).toUpperCase()}
                </span>
              )}
            </h3>

            {primaryRequest ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg font-black shrink-0 font-sans">
                    {primaryRequest.blood_group}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Patient: {primaryRequest.patient_name}</h4>
                    <span className="text-slate-400 font-medium text-xxs block">Required Units: {primaryRequest.required_units} Units</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xxs leading-relaxed font-semibold text-slate-500">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Required Date</span>
                    <span className="text-slate-800">{new Date(primaryRequest.required_date_time).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Location</span>
                    <span className="text-slate-800">{primaryRequest.location}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Physical Destination</span>
                    <span className="text-slate-800">ASN Raju Blood Centre, Bhimavaram</span>
                  </div>
                  {primaryRequest.coordinator_name && (
                    <div className="col-span-2 pt-1 border-t border-slate-150">
                      <span className="text-slate-400 block uppercase font-bold text-[9px] mb-0.5">Coordinator Assigned</span>
                      <span className="text-slate-800">{primaryRequest.coordinator_name} ({primaryRequest.coordinator_area})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-[10px] text-slate-400 font-medium">
                    This request is actively being reviewed. Donation visit scheduling must occur at the Bhimavaram center.
                  </p>
                  <Link
                    to={`/receiver/requests/${primaryRequest.id}`}
                    className="rounded-lg bg-brand-red px-4 py-2 text-xxs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer shrink-0"
                  >
                    View Request Details →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-slate-400 text-xs font-semibold">You have no active blood requests.</p>
                <Link
                  to="/receiver/request-blood"
                  className="inline-flex rounded-lg bg-brand-red px-4 py-2 text-xxs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
                >
                  Create Blood Request
                </Link>
              </div>
            )}
          </div>

          {/* RECENT REQUESTS LIST */}
          {recentRequests.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans">Recent Requests History</h3>
              <div className="divide-y divide-slate-150">
                {recentRequests.map(req => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs font-mono">
                        {req.blood_group}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Patient: {req.patient_name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {req.required_units} Units · {req.location} · {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusBadgeStyle(req.status)}`}>
                        {getFriendlyStatus(req.status)}
                      </span>
                      <Link
                        to={`/receiver/requests/${req.id}`}
                        className="text-xxs font-bold text-brand-red hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INFORMATION & WORKFLOW REMINDERS */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-2">
              Bhimavaram Center Guide
            </h3>
            <div className="text-xxs text-slate-500 leading-relaxed space-y-3 font-semibold">
              <p>
                <strong>Gift of Life</strong> coordinates matching with local donors registered in Bhimavaram.
              </p>
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1 text-slate-655">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Physical Center</span>
                <strong>ASN Raju Blood Centre</strong>
                <p className="mt-0.5 text-xxs font-medium text-slate-500 leading-normal">
                  ASN Raju Charitable Trust Buildings, near Local Market, Bhimavaram, Andhra Pradesh.
                </p>
              </div>
              <p>
                *Note: Accepting an online match does not confirm donation eligibility. Donors undergo standard medical screening at the center before extraction.*
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}