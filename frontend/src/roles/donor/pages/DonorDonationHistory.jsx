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

  // Calculate summary metrics ONLY from COMPLETED donations
  const completedDonations = history.filter((log) => log.status === 'COMPLETED');
  const totalDonations = completedDonations.length;
  const totalUnits = completedDonations.reduce((sum, log) => sum + Number(log.units || 0), 0);
  const lastDonation = completedDonations.length > 0 ? completedDonations[0].donation_date : null;

  return (
    <div className="page-stack">
      <PageHeader
        title="Donation History"
        description="View records of all your verified and completed blood donations."
      />

      <div className="space-y-6 max-w-5xl">
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Dynamic Summary Cards */}
        {totalDonations > 0 ? (
          <div className="grid gap-4 grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Donations</div>
              <div className="text-2xl font-extrabold text-slate-800">{totalDonations}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Units Donated</div>
              <div className="text-2xl font-extrabold text-slate-800">{totalUnits} Unit(s)</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Last Donation Date</div>
              <div className="text-xs font-bold text-slate-850 pt-1">
                {lastDonation
                  ? new Date(lastDonation).toLocaleDateString(undefined, { dateStyle: 'medium' })
                  : 'N/A'}
              </div>
            </div>
          </div>
        ) : null}

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <div className="text-sm font-bold text-slate-900 mb-1 font-sans">No Donations Logged</div>
            <div className="text-xs">Your completed and verified donations will appear here.</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600 font-medium">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold tracking-wider">
                    <th className="p-4">Donation Date</th>
                    <th className="p-4">Request Reference</th>
                    <th className="p-4">Recipient / Patient</th>
                    <th className="p-4">Location / Blood Centre</th>
                    <th className="p-4 text-center">Blood Group</th>
                    <th className="p-4 text-center">Units</th>
                    <th className="p-4 text-center">Outcome / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.map((log) => {
                    const dateStr = log.donation_date
                      ? new Date(log.donation_date).toLocaleDateString(undefined, {
                          dateStyle: 'medium'
                        })
                      : 'N/A';

                    const reqRef = log.request_id
                      ? `REQ-${log.request_id.substring(0, 5).toUpperCase()}`
                      : 'N/A';

                    const isCompleted = log.status === 'COMPLETED';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{dateStr}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">{reqRef}</td>
                        <td className="p-4 font-semibold text-slate-800">{log.patient_name || 'Individual Patient'}</td>
                        <td className="p-4 text-slate-500">{log.hospital_name || 'ASN Raju Blood Centre'}</td>
                        <td className="p-4 text-center text-brand-red font-bold">{log.blood_group}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{log.units} Unit(s)</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
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