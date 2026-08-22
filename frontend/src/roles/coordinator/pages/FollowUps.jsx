import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import { getFollowUps } from '../../../services/coordinatorService';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const filter = searchParams.get('filter') || 'ALL';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    async function loadFollowUps() {
      try {
        setLoading(true);
        const res = await getFollowUps({
          page,
          limit: 20,
          filter,
          search
        });
        setFollowUps(res.followUps || []);
        setTotalRecords(res.totalRecords || 0);
      } catch (err) {
        setError(err.message || 'Failed to load needs attention items');
      } finally {
        setLoading(false);
      }
    }
    loadFollowUps();
  }, [searchParams]);

  const handleFilterChange = (newFilter) => {
    setSearchParams({ filter: newFilter, search, page: '1' });
  };

  const handleSearchChange = (newSearch) => {
    setSearchParams({ filter, search: newSearch, page: '1' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ filter, search, page: newPage.toString() });
  };

  const totalPages = Math.ceil(totalRecords / 20);

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'ACTION_OVERDUE':
        return 'Action Overdue';
      case 'INITIAL_CONTACT_PENDING':
        return 'Initial Contact Pending';
      case 'VISIT_CONFIRMATION_PENDING':
        return 'Visit Confirmation Pending';
      case 'SCREENING_PENDING':
        return 'Screening Pending';
      case 'DONATION_LOG_PENDING':
        return 'Donation Log Pending';
      default:
        return 'Follow-up Pending';
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Needs Attention Queue"
        description="Identify and resolve active cases requiring immediate coordinator action, contact, or clinical progress updates."
      />

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 select-none">
          ⚠️ {error}
        </div>
      )}

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none">
        <div className="flex gap-2 border-b border-slate-100 md:border-b-0 pb-2 md:pb-0">
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            All Needs Attention
          </button>
          <button
            onClick={() => handleFilterChange('OVERDUE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              filter === 'OVERDUE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Overdue Actions
          </button>
          <button
            onClick={() => handleFilterChange('PENDING_ACTION')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              filter === 'PENDING_ACTION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Pending Actions
          </button>
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search donor or patient name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading items...</div>
      ) : followUps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
          <p className="text-slate-500 font-medium">
            No cases require your attention.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Active cases needing coordinator action will appear here when they match your requests.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {followUps.map((item) => (
            <article
              key={item.request_id}
              className={`rounded-2xl border bg-white p-5 shadow-sm flex flex-col justify-between hover:border-blue-300 transition duration-150 relative ${
                item.is_overdue ? 'border-rose-250 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start select-none">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.urgency_level === 'EMERGENCY' ? 'bg-red-50 text-red-700 border border-red-100' :
                    item.urgency_level === 'URGENT' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                    'bg-slate-50 text-slate-650'
                  }`}>
                    {item.urgency_level}
                  </span>
                  <span className="text-xl font-black text-blue-600">{item.blood_group}</span>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold select-none">Patient</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{item.patient_name}</h3>
                  </div>
                  {item.donor_name && (
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold select-none">Donor</span>
                      <h3 className="text-sm font-bold text-slate-700">{item.donor_name}</h3>
                      <p className="text-xxs text-slate-500 font-medium">
                        Phone: <a href={`tel:${item.donor_phone}`} className="text-blue-650 hover:underline">{item.donor_phone}</a>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold select-none">Hospital / Center</span>
                    <p className="text-xxs text-slate-500 font-medium">{item.hospital_name} ({item.location})</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[10px] text-slate-400 select-none">
                  <div className="flex justify-between items-center">
                    <span>Action Reason:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                      item.followup_reason === 'ACTION_OVERDUE' ? 'bg-rose-50 text-rose-700 font-black' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {getReasonLabel(item.followup_reason)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Case Status:</span>
                    <span className="font-bold text-slate-700 uppercase">{item.request_status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Time:</span>
                    <span className="font-semibold text-slate-500">
                      {new Date(item.assigned_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/coordinator/requests/${item.request_id}`, {
                  state: {
                    from: location.pathname + location.search,
                    label: 'Needs Attention'
                  }
                })}
                className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer text-center block"
              >
                View Request →
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none text-xs font-semibold text-slate-650 mt-4">
          <span>
            Page {page} of {totalPages} ({totalRecords} total cases)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-250 px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-slate-250 px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}