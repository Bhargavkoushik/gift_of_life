import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function RequestManagement() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ metrics: {}, requests: [] });
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [urgency, setUrgency] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');

  // Filter Popover Visibility
  const [showFilters, setShowFilters] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = [
    { value: 'PENDING', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved / Sourcing' },
    { value: 'DONORS_ALERTED', label: 'Donors Alerted' },
    { value: 'DONOR_RESPONDED', label: 'Donor Responded' },
    { value: 'COORDINATOR_ASSIGNED', label: 'Coordinator Assigned' },
    { value: 'DONOR_CONFIRMED', label: 'Donor Confirmed' },
    { value: 'FULFILLED', label: 'Fulfilled / Closed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'NO_DONOR_FOUND', label: 'No Donor Found' }
  ];

  const loadRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.getRequests({
        search: search || undefined,
        bloodGroup: bloodGroup || undefined,
        urgency: urgency || undefined,
        status: status || undefined,
        location: location || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sort
      });
      setData(res);
    } catch (err) {
      console.error('[RequestManagement] Error loading requests:', err);
      setErrorMsg(`Unable to load blood requests. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [bloodGroup, urgency, status, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  const clearFilters = () => {
    setSearch('');
    setBloodGroup('');
    setUrgency('');
    setStatus('');
    setLocation('');
    setDateFrom('');
    setDateTo('');
    setSort('newest');
    setShowFilters(false);
    // Reload with clean state
    setTimeout(() => {
      loadRequests();
    }, 50);
  };

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

  const getStatusBadgeStyle = (reqStatus) => {
    switch (reqStatus) {
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'DONOR_CONFIRMED':
      case 'COORDINATOR_ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'DONOR_RESPONDED':
        return 'bg-rose-50 text-rose-700 border-rose-150';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-150';
    }
  };

  const getFriendlyStatus = (reqStatus) => {
    const mapping = {
      'PENDING': 'Awaiting Approval',
      'APPROVED': 'Approved',
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

  const { metrics, requests } = data;

  return (
    <div className="page-stack max-w-6xl relative select-none">
      <PageHeader
        title="Requests"
        description="Monitor blood requests and their progress from creation to fulfillment."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm flex flex-wrap justify-between items-center gap-6 max-w-5xl">
        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Open Requests</span>
          <strong className="text-xl font-extrabold text-slate-800">{metrics?.open || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Emergency</span>
          <strong className="text-xl font-extrabold text-rose-600">{metrics?.emergency || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Awaiting Donor</span>
          <strong className="text-xl font-extrabold text-amber-600">{metrics?.awaitingDonor || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Donor Accepted</span>
          <strong className="text-xl font-extrabold text-indigo-600">{metrics?.accepted || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">In Coordination</span>
          <strong className="text-xl font-extrabold text-blue-600">{metrics?.coordination || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Completed</span>
          <strong className="text-xl font-extrabold text-emerald-600">{metrics?.completed || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Attention Needed</span>
          <strong className={`text-xl font-extrabold ${metrics?.attentionNeeded > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
            {metrics?.attentionNeeded || 0}
          </strong>
        </div>
      </div>

      {/* CONTROL ROW */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-5xl justify-between relative">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <input
            type="search"
            placeholder="Search by ID, patient, blood, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-red focus:outline-none bg-white font-semibold text-slate-700"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-red hover:bg-brand-red-dark px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2.5 items-center justify-end relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg border px-4 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                bloodGroup || urgency || status || location || dateFrom || dateTo
                  ? 'border-brand-red bg-rose-50 text-brand-red'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
              </svg>
              Filters
              {(bloodGroup || urgency || status || location || dateFrom || dateTo) && (
                <span className="ml-1 px-1.5 py-0.2 bg-brand-red text-white text-[9px] rounded-full">
                  {[bloodGroup, urgency, status, location, dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* FILTERS PANEL POPOVER */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-30 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800">Advanced Filters</h4>
                  <button type="button" onClick={clearFilters} className="text-[10px] font-bold text-brand-red hover:underline cursor-pointer">
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 bg-white"
                    >
                      <option value="">All Groups</option>
                      {bloodGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Urgency</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 bg-white"
                    >
                      <option value="">All Urgency Levels</option>
                      <option value="NORMAL">Standard / Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 bg-white"
                    >
                      <option value="">All Statuses</option>
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Location / District</label>
                    <input
                      type="text"
                      placeholder="e.g. Bhimavaram"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand-red bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowFilters(false);
                    loadRequests();
                  }}
                  className="w-full rounded-lg bg-brand-red py-2 text-center text-xs font-bold text-white transition hover:bg-brand-red-dark cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-650 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="emergency_first">Emergency First</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* REQUESTS DIRECTORY */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-sans text-xs">
          <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-brand-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading blood requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center max-w-5xl bg-slate-25/50">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-brand-red mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">No blood requests yet.</h3>
          <p className="text-xs text-slate-500 mt-1">New requests created by receivers will appear here.</p>
          {(search || bloodGroup || urgency || status || location) && (
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block rounded-2xl border border-slate-250 bg-white shadow-sm overflow-hidden max-w-5xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450">Request ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450">Patient Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">Blood</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">Units</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450">Location</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">Priority</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450">Created</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/super-admin/requests/${req.id}`)}
                    className="hover:bg-slate-25 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-500">
                      REQ-{req.id.substring(0, 5).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                      {req.patient_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-brand-red text-center">
                      {req.blood_group}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700 text-center">
                      {req.required_units}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-600 truncate max-w-[150px]">
                      {req.location}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] ${getUrgencyBadgeStyle(req.urgency_level)}`}>
                        {req.urgency_level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeStyle(req.status)}`}>
                        {getFriendlyStatus(req.status)}
                      </span>
                      {req.requires_attention && (
                        <span className="block mt-1 text-[8px] font-black text-rose-600 uppercase tracking-widest animate-pulse">
                          ⚠️ TIMEOUT
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-sans">
                      {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/super-admin/requests/${req.id}`)}
                        className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-[10px] font-extrabold text-slate-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST VIEW */}
          <div className="block md:hidden space-y-3 max-w-5xl">
            {requests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/super-admin/requests/${req.id}`)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 hover:border-slate-350 transition active:bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      REQ-{req.id.substring(0, 5).toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">{req.patient_name}</h4>
                  </div>
                  <span className="text-sm font-black text-brand-red">{req.blood_group}</span>
                </div>

                <div className="flex justify-between items-center border-t border-b border-slate-100 py-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Units</span>
                    <strong className="text-slate-750 font-bold">{req.required_units} Units</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Urgency</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] ${getUrgencyBadgeStyle(req.urgency_level)}`}>
                      {req.urgency_level}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeStyle(req.status)}`}>
                      {getFriendlyStatus(req.status)}
                    </span>
                    {req.requires_attention && (
                      <span className="block mt-0.5 text-[8px] font-black text-rose-600 uppercase tracking-widest text-center animate-pulse">
                        ⚠️ TIMEOUT
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium truncate max-w-[180px]">{req.location}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/super-admin/requests/${req.id}`);
                    }}
                    className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[10px] font-extrabold text-slate-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}