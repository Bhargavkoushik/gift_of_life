import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import { getCoordinatorRequests } from '../../../services/coordinatorService';

export default function AssignedRequests() {
  const [requests, setRequests] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const statusFilter = searchParams.get('status') || 'ALL';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const res = await getCoordinatorRequests({
          page,
          limit: 10,
          status: statusFilter,
          search
        });
        setRequests(res.requests || []);
        setTotalRecords(res.totalRecords || 0);
      } catch (err) {
        setError(err.message || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [searchParams]);

  const handleFilterChange = (newStatus) => {
    setSearchParams({ status: newStatus, search, page: '1' });
  };

  const handleSearchChange = (newSearch) => {
    setSearchParams({ status: statusFilter, search: newSearch, page: '1' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ status: statusFilter, search, page: newPage.toString() });
  };

  const terminalStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
  const totalPages = Math.ceil(totalRecords / 10);

  return (
    <div className="page-stack">
      <PageHeader
        title="Assigned Requests"
        description="Search, filter, and manage all requests currently or previously assigned to you."
      />

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none">
        <div className="flex-1">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Search Cases</label>
          <input
            type="text"
            placeholder="Search by patient, hospital, or location..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="ALL">All Assignments</option>
            <option value="ACTIVE">Active Cases</option>
            <option value="ASSIGNED">Status: Assigned</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="COMPLETED">Completed Cases</option>
            <option value="REASSIGNED">Reassigned Cases</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
          <p className="text-slate-500 font-medium">No assigned requests found matching the filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 select-none">
                  <th className="p-4">Patient & Blood</th>
                  <th className="p-4">Hospital & Location</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Request Status</th>
                  <th className="p-4">Assignment</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => {
                  const isActive = ['ASSIGNED', 'IN_PROGRESS'].includes(req.assignment_status) && !terminalStatuses.includes(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{req.patient_name}</div>
                        <div className="text-blue-600 font-bold text-xxs mt-0.5">{req.blood_group} | {req.required_units} Units</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{req.hospital_name}</div>
                        <div className="text-slate-400 text-xxs mt-0.5">{req.location}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          req.urgency_level === 'EMERGENCY' ? 'bg-red-50 text-red-600 border border-red-100' :
                          req.urgency_level === 'URGENT' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {req.urgency_level}
                        </span>
                      </td>
                      <td className="p-4 font-semibold uppercase text-xxs">
                        <span className={req.status === 'FULFILLED' ? 'text-emerald-600' : terminalStatuses.includes(req.status) ? 'text-slate-400' : 'text-amber-600'}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-semibold uppercase text-xxs">
                        <span className={req.assignment_status === 'COMPLETED' ? 'text-emerald-600' : req.assignment_status === 'REASSIGNED' ? 'text-rose-600' : 'text-blue-600'}>
                          {req.assignment_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => navigate(`/coordinator/requests/${req.id}`, { state: { from: location.pathname + location.search, label: 'Assigned Requests' } })}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              : 'border border-slate-250 bg-white hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'Manage →' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none text-xs font-semibold text-slate-600 mt-4">
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