import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await adminService.getStats();
        setStats(data.stats);
      } catch (err) {
        setErrorMsg('Failed to load system metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-6xl">
      <PageHeader
        title="Admin Dashboard"
        description="Comprehensive monitoring, statistics, and audit activity for ASN Raju Charitable Trust."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          {/* Section 1: Administrator Lifecycle Monitoring */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2">
              Administrator Lifecycle Monitoring
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Invitations</span>
                <div className="text-2xl font-extrabold text-slate-800">{stats.pendingInvitations || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Invited link active</span>
              </div>

              <div className={`rounded-2xl border p-5 shadow-sm space-y-1 ${stats.emailIssues > 0 ? 'border-rose-250 bg-rose-50/10' : 'border-slate-200 bg-white'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Delivery Issues</span>
                <div className={`text-2xl font-extrabold ${(stats.emailIssues || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {stats.emailIssues || 0}
                </div>
                <span className="text-xxs text-slate-400 font-medium">SMTP/provider send failures</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Verification</span>
                <div className="text-2xl font-extrabold text-amber-600">{stats.awaitingVerification || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Details submitted, pending review</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Under Review</span>
                <div className="text-2xl font-extrabold text-blue-600">{stats.underReview || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Under active administrator check</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved / Awaiting Activation</span>
                <div className="text-2xl font-extrabold text-emerald-600">{stats.awaitingActivation || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Verification approved, inactive</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Administrators</span>
                <div className="text-2xl font-extrabold text-purple-600">{stats.activeAdmins || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Full secure backend access</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inactive Administrators</span>
                <div className="text-2xl font-extrabold text-slate-500">{stats.inactiveAdmins || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Deactivated accounts</span>
              </div>
            </div>
          </div>

          {/* Coordinator Operational Monitoring */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2 font-sans">
              Coordinator Operational Summary
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Coordinators</span>
                <div className="text-2xl font-extrabold text-brand-red">{stats.activeCoordinators || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Total active coordinators</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
                <div className="text-2xl font-extrabold text-amber-600">{stats.pendingCoordinatorVerifications || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Awaiting trust review</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Available Now</span>
                <div className="text-2xl font-extrabold text-emerald-600">{stats.coordinatorsAvailable || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Operational & ready</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Busy</span>
                <div className="text-2xl font-extrabold text-blue-600">{stats.coordinatorsBusy || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Actively handling cases</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Offline</span>
                <div className="text-2xl font-extrabold text-slate-500">{stats.coordinatorsOffline || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Not checked in</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requests Coordinated</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.requestsBeingCoordinated || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Under active coordination</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Donations Today</span>
                <div className="text-2xl font-extrabold text-emerald-600">{stats.donationsCoordinatedToday || 0}</div>
                <span className="text-xxs text-slate-400 font-medium">Donations coordinated today</span>
              </div>
            </div>
          </div>

          {/* Section 2: General System Stats */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2">
              Blood Bank & Platform Activity
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Donors</span>
                <div className="text-2xl font-extrabold text-brand-red">{stats.totalDonors}</div>
                <span className="text-xxs text-slate-400 font-medium">Registered donor profiles</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Receivers</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.totalReceivers}</div>
                <span className="text-xxs text-slate-400 font-medium">Registered receiver profiles</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Coordinators</span>
                <div className="text-2xl font-extrabold text-blue-600">{stats.activeCoordinators}</div>
                <span className="text-xxs text-slate-400 font-medium">Verified operational staff</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Requests</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.activeRequests}</div>
                <span className="text-xxs text-slate-400 font-medium">Live matching cases</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Responses</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.pendingResponses}</div>
                <span className="text-xxs text-slate-400 font-medium">Offers needing coordination</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visits Scheduled</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.visitsCoordination}</div>
                <span className="text-xxs text-slate-400 font-medium">Donor centre visits confirmed</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Donations Logged</span>
                <div className="text-2xl font-extrabold text-emerald-600">{stats.donationsRecorded}</div>
                <span className="text-xxs text-slate-400 font-medium">Successful donations completed</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Cases</span>
                <div className="text-2xl font-extrabold text-slate-900">{stats.completedRequests}</div>
                <span className="text-xxs text-slate-400 font-medium">Requests resolved successfully</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}