import { useState, useEffect, useRef } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const actionLabels = {
  'ADMIN_ACCOUNT_ACTIVATED': 'Administrator activated',
  'ADMIN_ACCOUNT_DEACTIVATED': 'Administrator deactivated',
  'COORDINATOR_ACTIVATED': 'Coordinator activated',
  'COORDINATOR_DEACTIVATED': 'Coordinator deactivated',
  'ADMIN_ASSIGNED_COORDINATOR': 'Coordinator assigned',
  'ADMIN_REASSIGNED_COORDINATOR': 'Coordinator reassigned',
  'ADMIN_CANCELLED_REQUEST': 'Request cancelled',
  'RECEIVER_REQUEST_CANCELLED': 'Request cancelled',
  'RECEIVER_REQUEST_CREATED': 'Request created',
  'ADMIN_DELETED_NOTIFICATION': 'Alert cleared',
  'ADMIN_FIRST_LOGIN': 'Administrator logged in',
  'ADMIN_LOGIN': 'Administrator logged in',
  'ADMIN_INVITATION_CREATED': 'Invitation created',
  'COORDINATOR_INVITED': 'Invitation created',
  'ADMIN_INVITATION_EMAIL_SENT': 'Invitation email sent',
  'COORDINATOR_EMAIL_SENT': 'Invitation email sent',
  'ADMIN_INVITATION_EMAIL_FAILED': 'Invitation email failed',
  'COORDINATOR_EMAIL_FAILED': 'Invitation email failed',
  'ADMIN_INVITATION_OPENED': 'Invitation opened',
  'COORDINATOR_INVITATION_OPENED': 'Invitation opened',
  'ADMIN_INVITATION_ACCEPTED': 'Invitation accepted',
  'COORDINATOR_INVITATION_ACCEPTED': 'Invitation accepted',
  'ADMIN_VERIFICATION_SUBMITTED': 'Verification submitted',
  'COORDINATOR_VERIFICATION_SUBMITTED': 'Verification submitted',
  'ADMIN_VERIFICATION_APPROVED': 'Verification approved',
  'COORDINATOR_VERIFICATION_APPROVED': 'Verification approved',
  'ADMIN_VERIFICATION_REJECTED': 'Verification rejected',
  'COORDINATOR_VERIFICATION_REJECTED': 'Verification rejected',
  'ADMIN_SENT_REMINDER': 'Reminder sent',
  'ADMIN_SENT_EMERGENCY_NOTIFICATION': 'Emergency notification sent',
  'BOOTSTRAP_ADMIN': 'Administrator initialized',
  'ADMIN_DELETED_AUDIT_LOGS': 'Audit logs soft-deleted',
  
  // Legacy actions
  'APPROVE_STAFF': 'Verification approved',
  'INVITE_STAFF': 'Invitation sent',
  'SUBMIT_VERIFICATION': 'Verification submitted',
  'UPDATE_USER_STATUS': 'Account status changed'
};

const formatTimeAgo = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  if (isNaN(seconds)) return '';
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Pagination & Filter Toolbar states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Row Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const checkboxRef = useRef(null);
  
  // Modal states
  const [selectedLog, setSelectedLog] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Fetch logs when page/search/filters change
  const loadLogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = {
        page,
        limit,
        search: searchQuery,
        category: categoryFilter,
        dateFrom: dateFrom && !isNaN(new Date(dateFrom).getTime()) ? new Date(dateFrom).toISOString() : null,
        dateTo: dateTo && !isNaN(new Date(dateTo).getTime()) ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString() : null
      };
      const res = await adminService.getAuditLogs(params);
      if (res.pagination) {
        const totalRecs = res.pagination.totalRecords || 0;
        const totalPgs = res.pagination.totalPages || 1;
        
        if (page > totalPgs && totalPgs >= 1) {
          setPage(totalPgs); // Auto-correct pagination
        } else {
          setLogs(res.logs || []);
          setTotalRecords(totalRecs);
          setTotalPages(totalPgs);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, searchQuery, categoryFilter, dateFrom, dateTo, limit]);

  // Reset pagination to page 1 and clear selection on filter changes
  const handleFilterChange = (setter, val) => {
    setter(val);
    setSelectedIds([]);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setSelectedIds([]);
    setPage(1);
  };

  // Checkbox handlers
  const handleCheckboxChange = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const isAllSelected = logs.length > 0 && logs.every(log => selectedIds.includes(log.id));
  const isSomeSelected = logs.some(log => selectedIds.includes(log.id)) && !isAllSelected;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleSelectAllToggle = () => {
    const visibleIds = logs.map(l => l.id);
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const unique = new Set([...prev, ...visibleIds]);
        return Array.from(unique);
      });
    }
  };

  // Soft-Delete API trigger
  const handleDeleteSelected = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.deleteAuditLogs(selectedIds);
      setSuccessMsg(`${res.count || selectedIds.length} audit logs deleted.`);
      setSelectedIds([]);
      setShowConfirmDelete(false);
      
      // Auto fade success message
      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
      
      await loadLogs();
    } catch (err) {
      setErrorMsg('Unable to delete the selected audit logs. Please try again.');
      setShowConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  // PDF Export Generation
  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = {
        search: searchQuery,
        category: categoryFilter,
        dateFrom: dateFrom && !isNaN(new Date(dateFrom).getTime()) ? new Date(dateFrom).toISOString() : null,
        dateTo: dateTo && !isNaN(new Date(dateTo).getTime()) ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString() : null,
        download: true
      };
      
      const res = await adminService.getAuditLogs(params);
      const downloadLogs = res.logs || [];
      
      if (downloadLogs.length === 0) {
        setErrorMsg('No audit logs found to download.');
        return;
      }
      
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('AUDIT LOGS REPORT', 14, 15);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      
      const activeFilters = [];
      if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`);
      if (categoryFilter) activeFilters.push(`Category: ${categoryFilter}`);
      if (dateFrom) activeFilters.push(`From: ${dateFrom}`);
      if (dateTo) activeFilters.push(`To: ${dateTo}`);
      doc.text(`Filters: ${activeFilters.length > 0 ? activeFilters.join(', ') : 'All'}`, 14, 27);
      
      doc.autoTable({
        startY: 32,
        head: [['Time', 'Actor', 'Activity', 'Target']],
        body: downloadLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.actor_name || 'System',
          actionLabels[log.action] || log.action,
          getTargetDisplay(log)
        ]),
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 }
      });
      
      doc.save(`audit_logs_${new Date().toISOString().slice(0, 10)}.pdf`);
      setSuccessMsg('PDF downloaded successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Human friendly target display helper
  const getTargetDisplay = (log) => {
    const meta = log.metadata || {};
    if (meta.coordinator_name) return meta.coordinator_name;
    if (meta.new_coordinator) return meta.new_coordinator;
    if (meta.email) return meta.email.split('@')[0];
    
    if (log.entity_type === 'BLOOD_REQUEST') {
      return meta.patient_name ? `Request: ${meta.patient_name}` : `Request #${log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}`;
    }
    if (log.entity_type === 'INVITATION') return 'Invitation';
    if (log.entity_type === 'NOTIFICATION') return 'Notification';
    if (log.entity_id) return `${log.entity_type} #${log.entity_id.slice(0, 8)}`;
    return 'N/A';
  };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(startIndex + limit - 1, totalRecords);

  return (
    <div className="page-stack">
      <PageHeader
        title="Audit Logs"
        description="Concise administrative history tracking administrative actions, staff promotions, and system alerts."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-5xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 max-w-5xl">
          ✅ {successMsg}
        </div>
      )}

      {/* Simplified Filter Toolbar & PDF Trigger */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 max-w-5xl shadow-sm space-y-3 font-semibold text-slate-700 text-xs">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end">
          {/* Text Search */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search activity..."
              className="rounded-lg border border-slate-250 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-red transition"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
              className="rounded-lg border border-slate-250 bg-slate-50 px-3 py-2 text-xs text-slate-855 focus:bg-white focus:outline-none focus:border-brand-red transition"
            >
              <option value="">All Categories</option>
              <option value="Coordinator">Coordinator</option>
              <option value="Request">Request</option>
              <option value="Donation">Donation</option>
              <option value="Administrator">Administrator</option>
              <option value="Invitation">Invitation</option>
              <option value="Notification">Notification</option>
              <option value="Authentication">Authentication</option>
            </select>
          </div>

          {/* Date Picker Input */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
              className="rounded-lg border border-slate-250 bg-slate-50 px-3 py-2 text-xs text-slate-805 focus:bg-white focus:outline-none focus:border-brand-red transition"
            />
          </div>

          {/* Date Picker To */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
              className="rounded-lg border border-slate-250 bg-slate-50 px-3 py-2 text-xs text-slate-805 focus:bg-white focus:outline-none focus:border-brand-red transition"
            />
          </div>

          {/* Buttons Group */}
          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              className="w-1/2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 text-xs border border-slate-250 transition cursor-pointer select-none"
            >
              Clear
            </button>
            <button
              onClick={handleDownloadPDF}
              className="w-1/2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 text-xs border border-slate-250 transition cursor-pointer select-none"
            >
              PDF Export
            </button>
          </div>
        </div>

        {/* Dynamic Selection/Delete Panel */}
        {selectedIds.length > 0 && (
          <div className="flex justify-between items-center bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-900 animate-fade-in">
            <span>
              Selected <strong className="font-extrabold">{selectedIds.length}</strong> record{selectedIds.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 text-xs transition cursor-pointer select-none"
            >
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="max-w-5xl">
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        ref={checkboxRef}
                        checked={isAllSelected}
                        onChange={handleSelectAllToggle}
                        className="rounded border-slate-300 text-brand-red focus:ring-brand-red h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Activity</th>
                    <th className="p-4">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-655">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold font-sans">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(log.id)}
                            onChange={(e) => handleCheckboxChange(e, log.id)}
                            className="rounded border-slate-300 text-brand-red focus:ring-brand-red h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-400 font-mono">
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-[10px] opacity-75">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {log.actor_name || <span className="text-slate-450 italic font-semibold">System</span>}
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                          {actionLabels[log.action] || log.action}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">
                          {getTargetDisplay(log)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-slate-100 select-none">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                  No audit logs found.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 space-y-1.5 hover:bg-slate-50/50 active:bg-slate-100 transition cursor-pointer text-xs"
                  >
                    <div className="flex justify-between items-start text-slate-400 font-mono text-[10px]">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log.id)}
                          onChange={(e) => handleCheckboxChange(e, log.id)}
                          className="rounded border-slate-300 text-brand-red focus:ring-brand-red h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <span>{formatTimeAgo(log.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-950">
                      <span>{actionLabels[log.action] || log.action}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-xxs font-semibold">
                      <span>By: <strong className="text-slate-800">{log.actor_name || 'System'}</strong></span>
                      <span>Target: <strong className="text-slate-800">{getTargetDisplay(log)}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pagination Panel */}
        {!loading && logs.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none font-semibold text-slate-700 text-xs">
            <div className="text-slate-400">
              Showing <span className="font-bold text-slate-750">{startIndex}</span>–
              <span className="font-bold text-slate-750">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-750">{totalRecords}</span> events
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer text-xxs font-bold"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const items = [];
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    items.push(<span key={`dots-${p}`} className="px-1 text-slate-400 text-xxs">...</span>);
                  }
                  items.push(
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition cursor-pointer ${
                        page === p
                          ? 'bg-brand-red text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                  return items;
                })}

              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer text-xxs font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centers Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scale-up font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-slate-900">Delete Audit Logs?</h3>
            <p className="text-slate-500 leading-relaxed font-sans text-xxs">
              You are about to delete <strong className="font-extrabold text-slate-800">{selectedIds.length}</strong> selected audit log records.
              This action will remove these records from the Audit Logs view.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition select-none text-xxs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 cursor-pointer transition select-none text-xxs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Audit Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-scale-up font-semibold text-slate-700 text-xxs leading-relaxed">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center select-none bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900">Audit Event Details</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-650 h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center justify-center font-bold text-sm"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Action */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <span className="text-slate-455 uppercase font-extrabold tracking-wider text-[9px] pt-0.5">Action</span>
                <span className="text-slate-900 font-bold text-right text-xs">
                  {actionLabels[selectedLog.action] || selectedLog.action}
                </span>
              </div>

              {/* Performed By */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <span className="text-slate-455 uppercase font-extrabold tracking-wider text-[9px] pt-0.5">Performed by</span>
                <span className="text-slate-900 font-bold text-right">
                  {selectedLog.actor_name || <span className="text-slate-450 italic font-semibold">System</span>}
                </span>
              </div>

              {/* Target */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <span className="text-slate-455 uppercase font-extrabold tracking-wider text-[9px] pt-0.5">Target</span>
                <span className="text-slate-900 font-bold text-right font-sans">
                  {getTargetDisplay(selectedLog)}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <span className="text-slate-455 uppercase font-extrabold tracking-wider text-[9px] pt-0.5">Date & Time</span>
                <div className="text-right">
                  <div className="text-slate-900 font-bold">{new Date(selectedLog.created_at).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-mono">({formatTimeAgo(selectedLog.created_at)})</div>
                </div>
              </div>

              {/* Optional Fields */}
              {selectedLog.metadata && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto text-[10px] font-mono text-slate-650 space-y-1.5">
                  {Object.entries(selectedLog.metadata).map(([key, val]) => {
                    const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'key', 'otp', 'password_hash'];
                    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) return null;
                    
                    let displayKey = key;
                    if (key === 'notes') displayKey = 'Additional Details';
                    if (key === 'reason') displayKey = 'Reason';
                    
                    return (
                      <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0 gap-3">
                        <span className="font-bold text-slate-900 capitalize">{displayKey.replace('_', ' ')}:</span>
                        <span className="text-slate-500 text-right break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition select-none text-xxs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
