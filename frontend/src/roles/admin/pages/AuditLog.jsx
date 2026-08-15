import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await adminService.getAuditLogs();
        setLogs(data.logs || []);
      } catch (err) {
        setErrorMsg('Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
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
        title="Audit Logs"
        description="Immutable system audit trail tracking administrative actions, staff promotion, and coordination operations."
      />

      <div className="space-y-4 max-w-5xl">
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                      No audit log entries found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const meta = log.metadata || {};
                    let detailsString = '';
                    if (meta.email) detailsString += `Email: ${meta.email} `;
                    if (meta.role) detailsString += `Role: ${meta.role} `;
                    if (meta.status) detailsString += `Status: ${meta.status} `;
                    if (meta.notes) detailsString += `Notes: ${meta.notes} `;
                    if (!detailsString) detailsString = JSON.stringify(meta);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 whitespace-nowrap text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{log.actor_name}</span>
                          <span className="text-slate-400 text-xxs block font-mono">{log.actor_email}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-bold border uppercase ${
                            log.action.includes('BOOTSTRAP')
                              ? 'bg-purple-50 text-purple-800 border-purple-100'
                              : log.action.includes('APPROVE')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : log.action.includes('REJECT')
                              ? 'bg-rose-50 text-rose-800 border-rose-100'
                              : 'bg-blue-50 text-blue-800 border-blue-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xxs">
                          <span className="font-semibold text-slate-800 block">{log.entity_type}</span>
                          <span className="text-slate-400">{log.entity_id || 'N/A'}</span>
                        </td>
                        <td className="p-4 text-xxs text-slate-500 leading-relaxed font-sans max-w-xs break-words">
                          {detailsString}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
