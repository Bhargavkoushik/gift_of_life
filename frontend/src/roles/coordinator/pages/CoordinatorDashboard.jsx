import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import { getCoordinatorDashboardData } from '../../../services/coordinatorService';

export default function CoordinatorDashboard() {
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [metrics, setMetrics] = useState({ actionRequired: 0, inProgress: 0, completed: 0, cancelledRejected: 0 });
  const [totalActiveCount, setTotalActiveCount] = useState(0);
  const [totalCompletedCount, setTotalCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashData = await getCoordinatorDashboardData();
        setActiveCases(dashData.active.items || []);
        setCompletedCases(dashData.completed.items || []);
        setMetrics(dashData.summary || { actionRequired: 0, inProgress: 0, completed: 0, cancelledRejected: 0 });
        setTotalActiveCount(dashData.active.total || 0);
        setTotalCompletedCount(dashData.completed.total || 0);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="page-stack">
      <PageHeader
        title="Blood Bank Coordinator Dashboard"
        description="Verify matches, coordinate donor visits, record screenings, and log completed donations."
      />

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm select-none">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Action Required</span>
          <span className="text-2xl font-black text-slate-855 mt-1 block">{metrics.actionRequired}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm select-none">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">In Progress</span>
          <span className="text-2xl font-black text-slate-855 mt-1 block">{metrics.inProgress}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm select-none">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Completed</span>
          <span className="text-2xl font-black text-slate-855 mt-1 block">{metrics.completed}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm select-none">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cancelled / Rejected</span>
          <span className="text-2xl font-black text-slate-855 mt-1 block">{metrics.cancelledRejected}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading dashboard data...</div>
      ) : (
        <div className="space-y-10">
          {/* Active Cases Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center select-none">
              <h2 className="text-lg font-bold text-slate-900">Active Cases</h2>
              {totalActiveCount > 4 && (
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-slate-400">Showing 4 of {totalActiveCount} active cases</span>
                  <Link 
                    to="/coordinator/requests?status=ACTIVE" 
                    className="text-blue-600 hover:text-blue-700 transition"
                  >
                    View all active cases →
                  </Link>
                </div>
              )}
            </div>

            {activeCases.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
                <p className="text-slate-500 font-medium">You're all caught up. No active cases require your attention.</p>
                <p className="text-sm text-slate-400 mt-1">New requests will appear here when assigned.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeCases.slice(0, 4).map((req) => (
                  <article key={req.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition duration-150">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          req.urgency_level === 'EMERGENCY' ? 'bg-red-105 text-red-700 border border-red-200' :
                          req.urgency_level === 'URGENT' ? 'bg-amber-105 text-amber-700 border border-amber-200' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {req.urgency_level}
                        </span>
                        <span className="text-2xl font-black text-blue-600">{req.blood_group}</span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900">Patient: {req.patient_name}</h3>
                      <p className="mt-1 text-sm text-slate-500">Hospital: {req.hospital_name}</p>
                      <p className="text-xs text-slate-400">Location: {req.location}</p>

                      <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Required Units: <strong>{req.required_units}</strong></span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`font-semibold ${
                            req.status === 'DONOR_RESPONDED' ? 'text-amber-600' :
                            req.status === 'COORDINATOR_ASSIGNED' ? 'text-blue-600' :
                            req.status === 'DONOR_CONFIRMED' ? 'text-purple-600' : 'text-emerald-600'
                          }`}>
                            Status: {req.status.replace('_', ' ')}
                          </span>
                          {req.is_overdue && (
                            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 select-none animate-pulse">
                              Action Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/coordinator/requests/${req.id}`, { state: { from: location.pathname + location.search, label: 'Dashboard' } })}
                      className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer text-center block"
                    >
                      View / Manage →
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Completed Work Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center select-none">
              <h2 className="text-lg font-bold text-slate-800">Recently Completed</h2>
              {totalCompletedCount > 4 && (
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-slate-400">Showing 4 of {totalCompletedCount} completed cases</span>
                  <Link 
                    to="/coordinator/requests?status=COMPLETED" 
                    className="text-slate-600 hover:text-slate-800 transition"
                  >
                    View completed history →
                  </Link>
                </div>
              )}
            </div>

            {completedCases.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
                <p className="text-slate-500 font-medium">No completed cases yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {completedCases.slice(0, 4).map((req) => (
                  <article key={req.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                          {req.urgency_level}
                        </span>
                        <span className="text-2xl font-black text-slate-400">{req.blood_group}</span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-700">Patient: {req.patient_name}</h3>
                      <p className="mt-1 text-sm text-slate-500">Hospital: {req.hospital_name}</p>
                      <p className="text-xs text-slate-400">Location: {req.location}</p>

                      <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                        <span className="text-slate-400">Required Units: <strong>{req.required_units}</strong></span>
                        <span className={`font-semibold ${
                          req.status === 'FULFILLED' ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          Status: {req.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/coordinator/requests/${req.id}`, { state: { from: location.pathname + location.search, label: 'Dashboard' } })}
                      className="mt-6 w-full rounded-lg border border-slate-250 py-2.5 text-sm font-semibold text-slate-650 hover:bg-slate-100 bg-white transition cursor-pointer text-center block"
                    >
                      View Details
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}