import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';

export default function DonorDonationHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await donorService.getDonationHistory();
        setHistory(data || []);
      } catch (err) {
        setErrorMsg('Failed to load donation history. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Donation History"
        description="View records of all your previous blood donations and contributions."
      />

      <div className="space-y-4 max-w-3xl">
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <div className="text-sm font-bold text-slate-900 mb-1">No Donations Logged</div>
            <div className="text-xs">Once you accept and complete blood requests, your contributions will appear here.</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold tracking-wider">
                    <th className="p-4">Donation Date</th>
                    <th className="p-4">Recipient Context</th>
                    <th className="p-4 text-center">Units</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {history.map((log) => {
                    const dateStr = log.donation_date
                      ? new Date(log.donation_date).toLocaleDateString(undefined, {
                          dateStyle: 'medium'
                        })
                      : 'N/A';

                    const isCompleted = log.status === 'COMPLETED';
                    const isCancelled = log.status === 'CANCELLED';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{dateStr}</td>
                        <td className="p-4 space-y-1">
                          <div className="text-slate-800 font-semibold">
                            Patient: {log.patient_name || 'Individual Donation'}
                          </div>
                          <div className="text-slate-500 text-xxs">
                            {log.hospital_name || 'Local Hospital'}
                          </div>
                        </td>
                        <td className="p-4 text-center text-slate-800 font-bold">
                          {log.units} Unit(s)
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-semibold border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : isCancelled
                                ? 'bg-slate-50 text-slate-500 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}