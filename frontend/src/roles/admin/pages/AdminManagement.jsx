import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

export default function AdminManagement() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Invite states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Active Filters
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Timeline modal states
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Review states
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewInviteId, setReviewInviteId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Delete states
  const [invitationToDelete, setInvitationToDelete] = useState(null); // { id, email, role, status, linkOpened }

  const loadData = async () => {
    try {
      const data = await adminService.getStaff();
      setStaff(data.staff || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      setErrorMsg('Failed to load administrator lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.inviteStaff(inviteName, inviteEmail, 'ADMIN');
      setSuccessMsg(`Invitation created and email dispatch initiated for ${inviteEmail}.`);
      if (res.rawToken) {
        console.log(`[DEV ONLY LOG] Staff Invitation Link: ${window.location.origin}/accept-invite?token=${res.rawToken}`);
      }
      setInviteName('');
      setInviteEmail('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setActioning(false);
    }
  };

  const handleResend = async (invitationId, email) => {
    if (!window.confirm(`Resend administrator invitation to ${email}? This will invalidate previous tokens.`)) {
      return;
    }
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.resendInvitation(invitationId);
      setSuccessMsg(`Invitation resent successfully to ${email}.`);
      if (res.rawToken) {
        console.log(`[DEV ONLY LOG] Resent Staff Invitation Link: ${window.location.origin}/accept-invite?token=${res.rawToken}`);
      }
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend invitation.');
    } finally {
      setActioning(false);
    }
  };

  const handleRevoke = async (invitationId, email) => {
    if (!window.confirm(`Revoke invitation for ${email}? The recipient will no longer be able to accept it.`)) {
      return;
    }
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.revokeInvitation(invitationId);
      setSuccessMsg(`Invitation for ${email} successfully revoked.`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to revoke invitation.');
    } finally {
      setActioning(false);
    }
  };

  const handleReviewSubmit = async (action) => {
    if (!reviewInviteId) return;
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.reviewVerification(reviewInviteId, action, reviewNotes);
      setSuccessMsg(res.message);
      setReviewNotes('');
      setReviewInviteId(null);
      setShowReviewModal(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setActioning(false);
    }
  };

  const handleStatusToggle = async (userId, email, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    // Self-deactivation warning
    if (userId === currentUser?.id && nextStatus === 'INACTIVE') {
      if (!window.confirm("WARNING: You are deactivating your own administrator account. You will lose access immediately after this operation. Do you want to proceed?")) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to change status of ${email} to ${nextStatus.toLowerCase()}?`)) {
        return;
      }
    }

    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.updateUserStatus(userId, nextStatus);
      setSuccessMsg(res.message);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteInvitationSubmit = async () => {
    if (!invitationToDelete) return;
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.deleteInvitation(invitationToDelete.id);
      setSuccessMsg(`Invitation for ${invitationToDelete.email} has been successfully deleted.`);
      setInvitationToDelete(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete invitation.');
      setInvitationToDelete(null);
    } finally {
      setActioning(false);
    }
  };

  // Helper to compute state of an invitation row
  const getComputedState = (invite, userAccount) => {
    if (invite.status === 'DELETED') return 'Deleted';
    if (invite.status === 'REVOKED') return 'Revoked';
    
    const userStatus = userAccount?.status || 'INACTIVE';
    
    if (invite.status === 'APPROVED') {
      return userStatus === 'ACTIVE' ? 'Active' : 'Approved';
    }
    if (invite.status === 'REJECTED') return 'Rejected';
    if (invite.status === 'VERIFICATION_SUBMITTED') return 'Verification Pending';
    if (invite.status === 'UNDER_REVIEW') return 'Under Review';
    
    if (invite.accepted_at) return 'Accepted';
    
    const isExpired = new Date(invite.expires_at) < new Date();
    if (isExpired) return 'Expired';
    
    if (invite.status === 'EMAIL_FAILED' || invite.email_status === 'FAILED') return 'Email Failed';
    if (invite.link_opened_at) return 'Link Opened';
    if (invite.status === 'INVITED' && invite.email_status === 'SENT') return 'Invited';
    
    return 'Invited';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  // Filter invitation records
  const adminInvites = invitations.filter(i => i.role === 'ADMIN');
  const adminUsers = staff.filter(s => s.roles.includes('ADMIN'));

  // Calculate metrics based on computed state
  const metrics = {
    pendingInvites: adminInvites.filter(i => {
      const u = adminUsers.find(au => au.email === i.email);
      const state = getComputedState(i, u);
      return ['Invited', 'Link Opened'].includes(state);
    }).length,
    awaitingVerification: adminInvites.filter(i => {
      const u = adminUsers.find(au => au.email === i.email);
      return getComputedState(i, u) === 'Verification Pending';
    }).length,
    activeAdmins: adminUsers.filter(u => u.status === 'ACTIVE').length,
    emailIssues: adminInvites.filter(i => {
      const u = adminUsers.find(au => au.email === i.email);
      return getComputedState(i, u) === 'Email Failed';
    }).length
  };

  // Compile combined records for rendering
  const records = adminInvites.map(invite => {
    const userAccount = adminUsers.find(u => u.email === invite.email);
    const computedState = getComputedState(invite, userAccount);
    return {
      invite,
      userAccount,
      computedState
    };
  });

  // Filter combined records
  const filteredRecords = records.filter(r => {
    const searchMatch = 
      r.invite.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.invite.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!searchMatch) return false;

    // Filter out Deleted invitations from All by default
    if (selectedFilter === 'All') {
      return r.computedState !== 'Deleted';
    }
    return r.computedState === selectedFilter;
  });

  const filterOptions = [
    'All', 'Invited', 'Email Failed', 'Link Opened', 'Accepted', 
    'Verification Pending', 'Under Review', 'Rejected', 'Approved', 
    'Active', 'Expired', 'Revoked', 'Deleted'
  ];

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Admin Management"
        description="Invite trust administrators, review identity submissions, and manage account statuses."
      />

      <div className="space-y-6 max-w-5xl">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-850 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* SUMMARY METRICS CARDS */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Pending Invitations</span>
            <div className="text-2xl font-extrabold text-slate-800">{metrics.pendingInvites}</div>
            <span className="text-xxs text-slate-400 font-medium">Invites awaiting link open</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Awaiting Verification</span>
            <div className="text-2xl font-extrabold text-amber-600">{metrics.awaitingVerification}</div>
            <span className="text-xxs text-slate-400 font-medium">Submissions awaiting review</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Admins</span>
            <div className="text-2xl font-extrabold text-purple-600">{metrics.activeAdmins}</div>
            <span className="text-xxs text-slate-400 font-medium">Active trust administrators</span>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm space-y-1 ${metrics.emailIssues > 0 ? 'border-rose-250 bg-rose-50/10' : 'border-slate-200 bg-white'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Email Issues</span>
            <div className={`text-2xl font-extrabold ${metrics.emailIssues > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{metrics.emailIssues}</div>
            <span className="text-xxs text-slate-400 font-medium">Failed mail dispatches</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* LEFT COLUMN: INVITE FORM */}
          <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 font-sans">Invite Administrator</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raju Varma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  disabled={actioning}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. raju@asnraju.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={actioning}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={actioning}
                className="w-full rounded-lg bg-brand-red py-2.5 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
              >
                {actioning ? 'Sending...' : 'Send Administrator Invite'}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: INVITATIONS TRACKER */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                <label className="text-xxs font-bold text-slate-400 uppercase mr-1">Filter:</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 p-1.5 text-xs focus:outline-none bg-slate-50 cursor-pointer font-bold text-slate-700"
                >
                  {filterOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 font-semibold text-xs">
                  No matching administrator invitations found.
                </div>
              ) : (
                filteredRecords.map(({ invite, userAccount, computedState }) => {
                  const stateColors = {
                    'Invited': 'bg-blue-50 text-blue-700 border-blue-100',
                    'Email Failed': 'bg-rose-50 text-rose-700 border-rose-100',
                    'Link Opened': 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    'Accepted': 'bg-amber-50 text-amber-700 border-amber-100',
                    'Verification Pending': 'bg-amber-100 text-amber-800 border-amber-250 animate-pulse',
                    'Under Review': 'bg-cyan-50 text-cyan-700 border-cyan-155',
                    'Rejected': 'bg-rose-100 text-rose-800 border-rose-250',
                    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Active': 'bg-emerald-100 text-emerald-800 border-emerald-250',
                    'Expired': 'bg-slate-50 text-slate-500 border-slate-200',
                    'Revoked': 'bg-slate-100 text-slate-655 border-slate-300',
                    'Deleted': 'bg-rose-50 text-rose-700 border-rose-150 line-through'
                  };

                  return (
                    <article key={invite.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4 hover:border-slate-300 transition">
                      <div className="space-y-3 flex-1">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{invite.name}</h4>
                          <span className="text-slate-400 font-mono text-xxs block">{invite.email}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xxs text-slate-500 font-medium">
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Verification / Account Status</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 mt-0.5 border text-[10px] font-bold ${stateColors[computedState]}`}>
                              {computedState === 'Approved' ? 'Approved / Inactive' : computedState === 'Active' ? 'Approved / Active' : computedState.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Email Status</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 mt-0.5 border text-[10px] font-bold ${
                              invite.email_status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              invite.email_status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              invite.email_status === 'SENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {invite.email_status}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Invitation Link</span>
                            <span>{invite.link_opened_at ? `Opened · ${formatTimestamp(invite.link_opened_at)}` : 'Not opened'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Verification Details</span>
                            <span>
                              {invite.status === 'VERIFICATION_SUBMITTED' ? 'Submitted' :
                               invite.status === 'APPROVED' ? 'Approved' :
                               invite.status === 'REJECTED' ? 'Rejected' : 
                               invite.status === 'DELETED' ? 'Deleted' : 'Not submitted'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Account Status</span>
                            <span>{userAccount ? userAccount.status : 'Pending Activation'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[9px]">Expires</span>
                            <span>{formatTimestamp(invite.expires_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-end items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedInvite({ invite, userAccount, computedState });
                            setShowTimelineModal(true);
                          }}
                          className="w-full md:w-28 rounded-lg bg-slate-50 py-1.5 text-xxs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-center"
                        >
                          View Details
                        </button>

                        {/* Context-sensitive invitation actions */}
                        {['Invited', 'Link Opened', 'Email Failed', 'Expired'].includes(computedState) && (
                          <button
                            onClick={() => handleResend(invite.id, invite.email)}
                            disabled={actioning}
                            className="w-full md:w-28 rounded-lg bg-amber-500 py-1.5 text-xxs font-bold text-white hover:bg-amber-600 transition cursor-pointer"
                          >
                            Resend Invite
                          </button>
                        )}

                        {/* Permanent Delete Button - Allowed before acceptance */}
                        {['Invited', 'Link Opened', 'Email Failed', 'Expired', 'Revoked'].includes(computedState) && (
                          <button
                            onClick={() => setInvitationToDelete({
                              id: invite.id,
                              email: invite.email,
                              role: invite.role,
                              status: computedState,
                              linkOpened: !!invite.link_opened_at
                            })}
                            disabled={actioning}
                            className="w-full md:w-28 rounded-lg bg-rose-600 py-1.5 text-xxs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                          >
                            Delete Invitation
                          </button>
                        )}

                        {['Verification Pending', 'Under Review'].includes(computedState) && (
                          <button
                            onClick={() => {
                              setReviewInviteId(invite.id);
                              setShowReviewModal(true);
                            }}
                            disabled={actioning}
                            className="w-full md:w-28 rounded-lg bg-blue-600 py-1.5 text-xxs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                          >
                            Review Details
                          </button>
                        )}

                        {computedState === 'Approved' && (
                          <button
                            onClick={() => handleStatusToggle(userAccount.id, invite.email, 'ACTIVE')}
                            disabled={actioning}
                            className="w-full md:w-28 rounded-lg bg-emerald-600 py-1.5 text-xxs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Activate Account
                          </button>
                        )}

                        {computedState === 'Active' && (
                          <button
                            onClick={() => handleStatusToggle(userAccount.id, invite.email, 'INACTIVE')}
                            disabled={actioning}
                            className="w-full md:w-28 rounded-lg border border-rose-200 text-rose-700 py-1.5 text-xxs font-bold hover:bg-rose-50 transition cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE DETAILS MODAL */}
      {showTimelineModal && selectedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Administrator Invitation Details</h3>
                <span className="text-xxs text-slate-450 block font-mono">{selectedInvite.invite.email}</span>
              </div>
              <button
                onClick={() => {
                  setShowTimelineModal(false);
                  setSelectedInvite(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Grouped Vertical Timeline */}
            <div className="space-y-6">
              
              {/* Section 1: Invitation Lifecycle */}
              <div className="space-y-4">
                <h4 className="text-xxs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">1. Invitation Lifecycle</h4>
                <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Created */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className="absolute -left-[21px] rounded-full bg-emerald-500 h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white">✓</div>
                    <div>
                      <strong className="text-slate-800">Invitation Created</strong>
                      <span className="text-[10px] text-slate-450 font-mono block mt-0.5">{formatTimestamp(selectedInvite.invite.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Sent */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.invite.email_status === 'SENT' ? 'bg-emerald-500' :
                      selectedInvite.invite.email_status === 'FAILED' ? 'bg-rose-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.invite.email_status === 'SENT' ? '✓' : selectedInvite.invite.email_status === 'FAILED' ? '!' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">
                        {selectedInvite.invite.email_status === 'FAILED' ? 'Email Dispatch Failed' : 'Invitation Email Sent'}
                      </strong>
                      <span className="text-[10px] text-slate-450 font-mono block mt-0.5">
                        {selectedInvite.invite.sent_at ? formatTimestamp(selectedInvite.invite.sent_at) : 'Pending sending'}
                      </span>
                    </div>
                  </div>

                  {/* Opened */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.invite.link_opened_at ? 'bg-emerald-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.invite.link_opened_at ? '✓' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Invitation Link Opened</strong>
                      <span className="text-[10px] text-slate-450 font-mono block mt-0.5">
                        {selectedInvite.invite.link_opened_at ? formatTimestamp(selectedInvite.invite.link_opened_at) : 'Not opened yet'}
                      </span>
                    </div>
                  </div>

                  {/* Accepted */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.invite.accepted_at ? 'bg-emerald-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.invite.accepted_at ? '✓' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Invitation Accepted</strong>
                      <span className="text-[10px] text-slate-450 font-mono block mt-0.5">
                        {selectedInvite.invite.accepted_at ? formatTimestamp(selectedInvite.invite.accepted_at) : 'Not accepted yet'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Identity Verification */}
              <div className="space-y-4">
                <h4 className="text-xxs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">2. Identity Verification</h4>
                <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Submitted */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.invite.verification_submitted_at ? 'bg-emerald-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.invite.verification_submitted_at ? '✓' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Identity Details Submitted</strong>
                      {selectedInvite.invite.verification_submitted_at ? (
                        <div className="space-y-1 mt-1">
                          <span className="text-[10px] text-slate-450 font-mono block">{formatTimestamp(selectedInvite.invite.verification_submitted_at)}</span>
                          <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-xxs space-y-1 font-semibold text-slate-600 max-w-xs leading-relaxed">
                            <div><strong className="text-slate-700">Phone:</strong> {selectedInvite.invite.verification_data?.phone || 'N/A'}</div>
                            <div><strong className="text-slate-700">Employee ID:</strong> {selectedInvite.invite.verification_data?.employee_id || 'N/A'}</div>
                            {selectedInvite.invite.verification_data?.notes && (
                              <div><strong className="text-slate-700">Notes:</strong> {selectedInvite.invite.verification_data.notes}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-450 block mt-0.5">Not submitted yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Under Review */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      ['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(selectedInvite.invite.status) ? 'bg-emerald-500' : 'bg-slate-350'
                    }`}>
                      {['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(selectedInvite.invite.status) ? '✓' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Review In Progress</strong>
                      <span className="text-[10px] text-slate-450 block mt-0.5">
                        {['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(selectedInvite.invite.status) ? 'Review initiated.' : 'Awaiting review start.'}
                      </span>
                    </div>
                  </div>

                  {/* Approved / Rejected */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.invite.status === 'APPROVED' ? 'bg-emerald-500' :
                      selectedInvite.invite.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.invite.status === 'APPROVED' ? '✓' : selectedInvite.invite.status === 'REJECTED' ? '!' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Review Decision</strong>
                      {selectedInvite.invite.reviewed_at ? (
                        <div className="mt-1 space-y-1 text-slate-750 font-semibold">
                          <span className="text-[10px] text-slate-450 font-mono block">{formatTimestamp(selectedInvite.invite.reviewed_at)}</span>
                          <div>
                            Status: <span className={selectedInvite.invite.status === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}>{selectedInvite.invite.status}</span>
                          </div>
                          {selectedInvite.invite.rejection_reason && (
                            <div className="text-rose-600 italic bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xxs leading-relaxed max-w-xs break-words">
                              Rejection Reason: {selectedInvite.invite.rejection_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-450 block mt-0.5">Awaiting administrator verification check.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Account Access */}
              <div className="space-y-4">
                <h4 className="text-xxs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">3. Account Access</h4>
                <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Access Status */}
                  <div className="relative flex gap-3 text-xxs">
                    <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border border-white flex items-center justify-center shadow-sm text-[8px] text-white ${
                      selectedInvite.userAccount?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-350'
                    }`}>
                      {selectedInvite.userAccount?.status === 'ACTIVE' ? '✓' : ''}
                    </div>
                    <div>
                      <strong className="text-slate-800">Account Activation Status</strong>
                      <div className="mt-1 space-y-1 text-slate-700 font-semibold">
                        <div>
                          Status: <span className={selectedInvite.userAccount?.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-500'}>
                            {selectedInvite.userAccount?.status || 'INACTIVE'}
                          </span>
                        </div>
                        {selectedInvite.invite.activated_at && (
                          <div className="text-[10px] text-slate-450">
                            Activated: {formatTimestamp(selectedInvite.invite.activated_at)}
                          </div>
                        )}
                        {selectedInvite.invite.deactivated_at && (
                          <div className="text-[10px] text-slate-450">
                            Deactivated: {formatTimestamp(selectedInvite.invite.deactivated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* REVIEW VERIFICATION MODAL */}
      {showReviewModal && reviewInviteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">Review Administrator Verification Details</h3>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase">Review Feedback / Decision Notes</label>
              <textarea
                placeholder="Specify approval details, role scope, or rejection reasons..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={actioning}
                rows={4}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewInviteId(null);
                  setReviewNotes('');
                }}
                className="rounded-lg bg-slate-50 px-4 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewSubmit('REJECT')}
                disabled={actioning}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xxs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Reject Verification
              </button>
              <button
                onClick={() => handleReviewSubmit('APPROVE')}
                disabled={actioning}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xxs font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE INVITATION CONFIRMATION MODAL */}
      {invitationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-extrabold text-rose-600 uppercase tracking-wide border-b border-rose-50 pb-2">
              Delete Invitation?
            </h3>
            
            {invitationToDelete.linkOpened ? (
              <p className="text-xxs text-slate-500 font-semibold leading-relaxed">
                ⚠️ <strong>This invitation link has already been opened.</strong> Deleting it will immediately invalidate the invitation link. The recipient will not be able to continue registration.
              </p>
            ) : (
              <p className="text-xxs text-slate-500 font-semibold leading-relaxed">
                You are about to permanently remove this pending invitation. The invitee will no longer be able to use the invitation link. <strong>This action cannot be undone.</strong>
              </p>
            )}

            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xxs space-y-1 text-slate-600 font-semibold">
              <div><strong className="text-slate-700">Email:</strong> {invitationToDelete.email}</div>
              <div><strong className="text-slate-700">Role:</strong> {invitationToDelete.role === 'ADMIN' ? 'Administrator' : 'Coordinator'}</div>
              <div><strong className="text-slate-700">Status:</strong> {invitationToDelete.status}</div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInvitationToDelete(null)}
                className="rounded-lg bg-slate-50 px-4 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvitationSubmit}
                disabled={actioning}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xxs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                {actioning ? 'Deleting...' : 'Delete Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
