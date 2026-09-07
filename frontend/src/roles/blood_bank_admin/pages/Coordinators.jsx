import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function Coordinators() {
  const [coordinators, setCoordinators] = useState([]);
  const [filteredCoordinators, setFilteredCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadCoordinators = async () => {
    try {
      const data = await bloodBankAdminService.getCoordinators();
      setCoordinators(data);
      setFilteredCoordinators(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load coordinators list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  useEffect(() => {
    let result = coordinators;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.area && c.area.toLowerCase().includes(term))
      );
    }

    setFilteredCoordinators(result);
  }, [search, coordinators]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="Active Coordinators"
        description="Monitor staff coordinator assignments, workloads, coverage areas, and operational availability."
      />

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search name, email, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-brand-red font-semibold"
        />
      </div>

      {/* COORDINATOR TABLE LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredCoordinators.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">
            No active coordinators found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Coordinator Name</th>
                  <th className="p-4">Assigned Coverage Area</th>
                  <th className="p-4">Current Workload</th>
                  <th className="p-4">Availability Status</th>
                  <th className="p-4 pr-6">Contact Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                {filteredCoordinators.map((coord) => (
                  <tr key={coord.coordinator_profile_id} className="hover:bg-slate-50/50 transition duration-75">
                    <td className="p-4 pl-6">
                      <div className="font-extrabold text-slate-900">{coord.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{coord.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{coord.area || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{coord.district || 'Bhimavaram'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-extrabold border ${
                        coord.active_assignments_count > 3
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : coord.active_assignments_count > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {coord.active_assignments_count} Active Request(s)
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                        coord.availability_status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {coord.availability_status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 font-mono text-slate-800">
                      {coord.phone || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
