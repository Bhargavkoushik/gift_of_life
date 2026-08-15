import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        const active = await receiverService.getActiveRequests();
        setRequests(active);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to load requests list.');
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
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

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'EMERGENCY':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'URGENT':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-150';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-4xl">
      <PageHeader
        title="My Requests"
        description="A list of your current active requests and their operational verification progress."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {!errorMsg && requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm max-w-md mx-auto space-y-4">
          <p className="text-slate-500 font-semibold text-xs">No active blood requests found.</p>
          <Link
            to="/receiver/request-blood"
            className="inline-flex rounded-lg bg-brand-red px-4 py-2 text-xxs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
          >
            Request Blood
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(req => (
            <article key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-center">
                    <span className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-black text-xs font-mono">
                      {req.blood_group}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Patient: {req.patient_name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">Required Units: {req.required_units} Units</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getUrgencyStyle(req.urgency_level)}`}>
                      {req.urgency_level}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusStyle(req.status)}`}>
                      {getFriendlyStatus(req.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xxs leading-normal font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Required Before</span>
                    <span className="text-slate-800">{new Date(req.required_date_time).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Location</span>
                    <span className="text-slate-800">{req.location}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Destination Centre</span>
                    <span className="text-slate-800">ASN Raju Blood Centre, Bhimavaram</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">Created: {new Date(req.created_at).toLocaleDateString()}</span>
                <Link
                  to={`/receiver/requests/${req.id}`}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xxs font-bold text-slate-700 transition cursor-pointer"
                >
                  View Details →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}