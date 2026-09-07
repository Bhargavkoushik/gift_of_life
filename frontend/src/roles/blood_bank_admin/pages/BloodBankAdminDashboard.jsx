import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function BloodBankAdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const [requestsData, donorsData] = await Promise.all([
        bloodBankAdminService.getRequests(),
        bloodBankAdminService.getDonors()
      ]);
      setRequests(requestsData);
      setDonors(donorsData);
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

  if (error) {
    return (
      <div className="page-stack max-w-5xl">
        <PageHeader title="Blood Bank Admin Dashboard" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const activeRequests = requests.filter(r => ['PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'].includes(r.status));
  const urgentRequests = requests.filter(r => (r.urgency_level === 'URGENT' || r.urgency_level === 'EMERGENCY') && !['FULFILLED', 'CANCELLED', 'REJECTED'].includes(r.status));
  const fulfilledRequests = requests.filter(r => r.status === 'FULFILLED');
  const eligibleDonors = donors.filter(d => d.availability_status === 'AVAILABLE' && d.eligibility_status === 'ELIGIBLE');

  // Requests requiring attention: Urgents/Emergencies or PENDING review
  const attentionRequests = requests
    .filter(r => (r.urgency_level === 'EMERGENCY' || r.urgency_level === 'URGENT' || r.status === 'PENDING') && !['FULFILLED', 'CANCELLED', 'REJECTED'].includes(r.status))
    .slice(0, 3);

  return (
    <div className="page-stack max-w-7xl">
      
      {/* HEADER SECTION WITH FLEX ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Blood Bank Admin Dashboard"
          description="Oversee and monitor blood requests, donor matching progress, and coordination activity."
        />
        <Link
          to="/blood-bank-admin/requests/create"
          className="rounded-lg bg-brand-red hover:bg-brand-red-dark text-white font-bold px-4 py-2.5 text-xs shadow-sm transition duration-150 shrink-0 font-sans"
        >
          + Create Request
        </Link>
      </div>

      {/* METRICS GRID (4 columns) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Active Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Requests</div>
          <div className="text-2xl font-extrabold text-slate-850">{activeRequests.length}</div>
          <div className="text-xxs text-slate-400 font-medium">Seeking matching donors</div>
        </div>

        {/* Urgent / Emergency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgent/Emergency</div>
          <div className="text-2xl font-extrabold text-rose-600">{urgentRequests.length}</div>
          <div className="text-xxs text-slate-400 font-medium">Life-critical review states</div>
        </div>

        {/* Fulfilled Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfilled</div>
          <div className="text-2xl font-extrabold text-emerald-600">{fulfilledRequests.length}</div>
          <div className="text-xxs text-slate-400 font-medium">Completed donation events</div>
        </div>

        {/* Available Donors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Eligible Donors</div>
          <div className="text-2xl font-extrabold text-indigo-600">{eligibleDonors.length}</div>
          <div className="text-xxs text-slate-400 font-medium">Active compatible pools</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* RECENT REQUESTS LIST (Left column) */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Recent Blood Requests</h3>
            <Link to="/blood-bank-admin/requests" className="text-xxs font-bold text-brand-red hover:underline">
              View All →
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium font-sans">
              No requests logged in the system.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 font-medium font-sans text-xs">
              {requests.slice(0, 5).map(req => (
                <div key={req.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs">
                      {req.blood_group}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Patient: {req.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                        {req.required_units} Unit(s) · {req.hospital_name} · {req.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusBadgeStyle(req.status)}`}>
                      {getFriendlyStatus(req.status)}
                    </span>
                    <Link
                      to={`/blood-bank-admin/requests/${req.id}`}
                      className="rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 px-2.5 py-1 text-xxs font-bold text-slate-700 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REQUESTS REQUIRING ATTENTION (Right column) */}
        <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-2">
            Needs Attention
          </h3>

          {attentionRequests.length === 0 ? (
            <div className="py-8 text-center text-xxs text-slate-400 font-semibold font-sans">
              ✓ All requests are coordinated and monitored.
            </div>
          ) : (
            <div className="space-y-3 font-semibold text-xxs font-sans text-slate-600">
              {attentionRequests.map(req => (
                <div key={req.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5 flex flex-col justify-between">
                  <div className="leading-tight">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-brand-red uppercase">{req.blood_group} Needed</span>
                      <span className="text-[8px] font-bold text-rose-700 bg-rose-100/50 px-1.5 py-0.5 rounded border border-rose-150">
                        {req.urgency_level}
                      </span>
                    </div>
                    <strong className="text-slate-800 text-[11px] block mt-1">Patient: {req.patient_name}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{req.hospital_name}</span>
                  </div>
                  <Link
                    to={`/blood-bank-admin/requests/${req.id}`}
                    className="self-end text-xxs font-black text-brand-red hover:underline mt-1"
                  >
                    Manage Request →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
