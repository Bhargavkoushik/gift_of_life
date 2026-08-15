import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import { getCoordinatorRequests } from '../../../services/coordinatorService';

export default function CoordinatorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getCoordinatorRequests();
        setRequests(data);
      } catch (err) {
        setError(err.message || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
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

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading assigned requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 font-medium">No active donation workflows found.</p>
          <p className="text-sm text-slate-400 mt-1">Requests with active donor responses will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {requests.map((req) => (
            <article key={req.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition duration-150">
              <div>
                <div className="flex justify-between items-start">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    req.urgency_level === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                    req.urgency_level === 'URGENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {req.urgency_level}
                  </span>
                  <span className="text-2xl font-black text-blue-600">{req.blood_group}</span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">Patient: {req.patient_name}</h3>
                <p className="mt-1 text-sm text-slate-500">Hospital: {req.hospital_name}</p>
                <p className="text-xs text-slate-400">Location: {req.location}</p>

                <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Required Units: <strong>{req.required_units}</strong></span>
                  <span className={`font-semibold ${
                    req.status === 'DONOR_RESPONDED' ? 'text-amber-600' :
                    req.status === 'COORDINATOR_ASSIGNED' ? 'text-blue-600' :
                    req.status === 'DONOR_CONFIRMED' ? 'text-purple-600' : 'text-emerald-600'
                  }`}>
                    Status: {req.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/coordinator/requests/${req.id}`)}
                className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer text-center block"
              >
                Coordinate & Manage →
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}