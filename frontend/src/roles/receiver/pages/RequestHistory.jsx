import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function RequestHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await receiverService.getHistoryRequests();
        setHistory(data);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to load request history.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const getFriendlyStatus = (status) => {
    const mapping = {
      'FULFILLED': 'Donation Completed',
      'CANCELLED': 'Cancelled',
      'REJECTED': 'Denied',
      'NO_DONOR_FOUND': 'No Donor Found'
    };
    return mapping[status] || status;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELLED':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      case 'REJECTED':
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

  return (
    <div className="page-stack max-w-4xl">
      <PageHeader
        title="Past Requests"
        description="View your completed, cancelled, rejected, and closed blood requests."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {!errorMsg && history.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm max-w-md mx-auto space-y-2">
          <p className="text-slate-500 font-semibold text-xs">No past requests found.</p>
          <span className="text-xxs text-slate-400 font-medium leading-relaxed block">
            Completed or cancelled requests will show up in this archive.
          </span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {history.map(req => (
            <article key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-center">
                    <span className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs font-mono">
                      {req.blood_group}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Patient: {req.patient_name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">Required Units: {req.required_units} Units</span>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusStyle(req.status)}`}>
                    {getFriendlyStatus(req.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xxs leading-normal font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Required Before</span>
                    <span className="text-slate-850">{new Date(req.required_date_time).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Location</span>
                    <span className="text-slate-850">{req.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">Closed: {req.closed_at ? new Date(req.closed_at).toLocaleDateString() : 'N/A'}</span>
                <Link
                  to={`/receiver/requests/${req.id}`}
                  state={{ from: 'past' }}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xxs font-bold text-slate-700 transition cursor-pointer"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}