import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function BloodBankAdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await bloodBankAdminService.getRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFriendlyStatus = (status) => {
    const mapping = {
      'PENDING': 'Awaiting Action',
      'APPROVED': 'Coordinator Reviewing',
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

  if (error) {
    return (
      <div className="page-stack max-w-4xl">
        <PageHeader title="Blood Bank Admin Dashboard" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const activeRequests = requests.filter(r => ['PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'].includes(r.status));
  const fulfilledRequests = requests.filter(r => r.status === 'FULFILLED');

  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="Blood Bank Admin Dashboard"
        description="Submit blood requests directly and oversee coordinates for physical donation visits."
      />

      {/* METRICS ROW */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Requests</span>
          <div className="text-2xl font-extrabold text-slate-800">{activeRequests.length}</div>
          <span className="text-xxs text-slate-400 font-medium">Currently seeking matching donors</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Fulfilled Requests</span>
          <div className="text-2xl font-extrabold text-emerald-600">{fulfilledRequests.length}</div>
          <span className="text-xxs text-slate-400 font-medium">Completed donation events</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center">
          <Link
            to="/blood-bank-admin/requests/create"
            className="w-full text-center rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-3 text-xs shadow-sm transition duration-150"
          >
            + Create New Request
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* RECENT REQUESTS LIST */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Recent Requests Queue</span>
            <Link to="/blood-bank-admin/requests" className="text-xxs font-bold text-indigo-650 hover:underline">
              View All
            </Link>
          </h3>

          {requests.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-10 font-semibold">No requests logged in the system.</p>
          ) : (
            <div className="divide-y divide-slate-150">
              {requests.slice(0, 5).map(req => (
                <div key={req.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-rose-600 font-black text-xs font-sans">
                      {req.blood_group}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Patient: {req.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {req.required_units} Units · {req.hospital_name} · {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusBadgeStyle(req.status)}`}>
                      {getFriendlyStatus(req.status)}
                    </span>
                    <Link
                      to={`/blood-bank-admin/requests/${req.id}`}
                      className="text-xxs font-bold text-indigo-650 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RECRUITMENT AND COORDINATES INFO */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-2">
              Blood Bank Facility
            </h3>
            <div className="text-xxs text-slate-500 leading-relaxed space-y-3 font-semibold">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 text-slate-655">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">Trust Site Coordinates</span>
                <strong>ASN Raju Charitable Trust</strong>
                <p className="mt-0.5 text-xxs font-medium text-slate-500 leading-normal">
                  Sarovar Complex, Juvvalapalem Road, Bhimavaram - 534 202.
                </p>
              </div>
              <p>
                As a Blood Bank Administrator, you have the authority to create blood requests directly for patient attendants or hospitals.
              </p>
              <p>
                Every request created automatically matching compatible local donors and triggers coordinator routing rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
