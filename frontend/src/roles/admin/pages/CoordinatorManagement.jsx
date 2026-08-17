import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

export default function CoordinatorManagement() {
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
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Search and Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState('All');
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('All');

  // Details modal states & cache
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCoordDetails, setSelectedCoordDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalErrorMsg, setModalErrorMsg] = useState(null);
  const [selectedLoadingUserId, setSelectedLoadingUserId] = useState(null);
  const [activeLoadingId, setActiveLoadingId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [showInviteHistory, setShowInviteHistory] = useState(false);

  // Review states
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewInviteId, setReviewInviteId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Delete states
  const [invitationToDelete, setInvitationToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const loadData = async () => {
    try {
      const data = await adminService.getStaff();
      setStaff(data.staff || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      setErrorMsg('Failed to load coordinator lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format timestamps helper
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Plain language status translation
  const translateStatus = (status) => {
    const mapping = {
      'ASSIGNED': 'Assigned — waiting for coordinator action',
      'IN_PROGRESS': 'Coordinator is handling this case',
      'COMPLETED': 'Successfully completed',
      'FULFILLED': 'Successfully completed',
      'CANCELLED': 'Request cancelled',
      'REJECTED': 'Request rejected',
      'NO_DONOR_FOUND': 'No suitable donor found',
      'DONOR_RESPONDED': 'Donor has responded',
      'DONOR_CONFIRMED': 'Donor confirmed'
    };
    return mapping[status] || status;
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

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.inviteStaff(inviteName, inviteEmail, 'COORDINATOR');
      setSuccessMsg(`Coordinator invitation created and email dispatch initiated for ${inviteEmail}.`);
      if (res.rawToken) {
        console.log(`[DEV ONLY LOG] Coordinator Invitation Link: ${window.location.origin}/accept-invite?token=${res.rawToken}`);
      }
      setInviteName('');
      setInviteEmail('');
      setShowInviteModal(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send coordinator invitation.');
    } finally {
      setActioning(false);
    }
  };

  const handleResend = async (invitationId, email) => {
    if (!window.confirm(`Resend coordinator invitation to ${email}? This will invalidate previous tokens.`)) {
      return;
    }
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.resendInvitation(invitationId);
      setSuccessMsg(`Invitation resent successfully to ${email}.`);
      if (res.rawToken) {
        console.log(`[DEV ONLY LOG] Resent Coordinator Invitation Link: ${window.location.origin}/accept-invite?token=${res.rawToken}`);
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
      await adminService.revokeInvitation(invitationId);
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
      
      // Clear cache and close details modal to refresh
      if (selectedCoordDetails?.user?.id) {
        setDetailsCache(prev => {
          const newCache = { ...prev };
          delete newCache[selectedCoordDetails.user.id];
          return newCache;
        });
      }
      setShowDetailsModal(false);
      setSelectedCoordDetails(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setActioning(false);
    }
  };

  const handleStatusToggle = async (userId, email, targetStatus, activeCasesCount = 0) => {
    if (targetStatus === 'INACTIVE') {
      let confirmMsg = `Are you sure you want to deactivate ${email}?`;
      if (activeCasesCount > 0) {
        confirmMsg = `⚠️ WARNING: This coordinator currently has ${activeCasesCount} active cases. Deactivating this account may interrupt ongoing coordination.\n\nAre you sure you want to deactivate ${email}?`;
      }
      if (!window.confirm(confirmMsg)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to activate ${email}?`)) {
        return;
      }
    }

    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminService.updateUserStatus(userId, targetStatus);
      setSuccessMsg(res.message);
      
      // Clear cache for this coordinator user
      setDetailsCache(prev => {
        const newCache = { ...prev };
        delete newCache[userId];
        return newCache;
      });
      
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActioning(false);
    }
  };

  const handleSendReminder = async (requestId) => {
    try {
      setActioning(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await adminService.sendAdminReminder(requestId);
      if (res && res.success) {
        setSuccessMsg(res.message || 'Reminder notification sent successfully.');
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send reminder.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setActioning(false);
    }
  };

  const handleSendEmergency = async (requestId) => {
    const confirmed = window.confirm(
      'Are you sure you want to send an emergency escalation notification? This will dispatch urgent email and SMS notifications immediately.'
    );
    if (!confirmed) return;

    try {
      setActioning(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await adminService.sendEmergencyNotification(requestId);
      if (res && res.success) {
        setSuccessMsg(res.message || 'Emergency notification sent successfully.');
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send emergency notification.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setActioning(false);
    }
  };

  const handleViewDetails = async (userId) => {
    if (activeLoadingId === userId) return;
    
    // Check Cache
    if (detailsCache[userId]) {
      setSelectedCoordDetails({
        ...detailsCache[userId],
        invite: detailsCache[userId].invitation
      });
      setShowDetailsModal(true);
      setModalErrorMsg(null);
      setLoadingDetails(false);
      setShowInviteHistory(false);
      return;
    }

    // Open Modal Immediately with loading state
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setSelectedCoordDetails(null);
    setModalErrorMsg(null);
    setSelectedLoadingUserId(userId);
    setActiveLoadingId(userId);
    setShowInviteHistory(false);

    try {
      const data = await adminService.getCoordinatorDetails(userId);
      setDetailsCache(prev => ({ ...prev, [userId]: data }));
      setSelectedCoordDetails({
        ...data,
        invite: data.invitation
      });
    } catch (err) {
      setModalErrorMsg(err.response?.data?.message || 'Failed to load coordinator profile details.');
    } finally {
      setLoadingDetails(false);
      setActiveLoadingId(null);
    }
  };

  const handleDeleteInvitationSubmit = async () => {
    if (!invitationToDelete) return;
    setActioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await adminService.deleteInvitation(invitationToDelete.id);
      setSuccessMsg(`Invitation for ${invitationToDelete.email} has been successfully deleted.`);
      setInvitationToDelete(null);
      setShowDetailsModal(false);
      setSelectedCoordDetails(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete invitation.');
      setInvitationToDelete(null);
    } finally {
      setActioning(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusFilter('All');
    setSelectedVerificationFilter('All');
    setSelectedCenterFilter('All');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const coordinatorInvites = invitations.filter(i => i.role === 'COORDINATOR');
  const coordinatorUsers = staff.filter(s => s.roles.includes('COORDINATOR'));

  // Compile combined records (union of invites and user accounts)
  const records = [];
  
  // 1. Add all invitations (and match users if exist)
  coordinatorInvites.forEach(invite => {
    const userAccount = coordinatorUsers.find(u => u.email === invite.email);
    const computedState = getComputedState(invite, userAccount);
    records.push({
      invite,
      userAccount,
      computedState
    });
  });

  // 2. Add users who do not have an invitation (legacy/seeded staff)
  coordinatorUsers.forEach(userAccount => {
    const hasInvite = coordinatorInvites.some(i => i.email === userAccount.email);
    if (!hasInvite) {
      const virtualInvite = {
        id: `virtual-${userAccount.id}`,
        name: userAccount.name,
        email: userAccount.email,
        role: 'COORDINATOR',
        status: 'APPROVED',
        created_at: userAccount.created_at,
        email_status: 'SENT',
        sent_at: userAccount.created_at,
        link_opened_at: null,
        accepted_at: userAccount.created_at,
        verification_submitted_at: null,
        reviewed_at: userAccount.created_at,
        verification_data: {
          employee_id: 'Pre-registered',
          phone: userAccount.phone || 'N/A',
          notes: 'Pre-registered or legacy coordinator'
        }
      };
      records.push({
        invite: virtualInvite,
        userAccount,
        computedState: userAccount.status === 'ACTIVE' ? 'Active' : 'Approved'
      });
    }
  });

  // Filter combined records
  const filteredRecords = records.filter(r => {
    // 1. Search Query
    const empId = r.invite.verification_data?.employee_id || '';
    const centerName = r.userAccount?.coordinator_area 
      ? `ASN Raju Blood Centre, ${r.userAccount.coordinator_area}`
      : 'ASN Raju Blood Centre, Bhimavaram';
    
    const searchMatch = 
      r.invite.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.invite.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centerName.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!searchMatch) return false;

    // 2. Status Filter
    if (selectedStatusFilter === 'Active') {
      if (r.computedState !== 'Active') return false;
    } else if (selectedStatusFilter === 'Inactive') {
      if (r.computedState === 'Active') return false;
    }

    // 3. Verification Filter
    if (selectedVerificationFilter !== 'All') {
      const inviteStatus = r.invite.status;
      if (selectedVerificationFilter === 'Approved') {
        if (inviteStatus !== 'APPROVED') return false;
      } else if (selectedVerificationFilter === 'Under Review') {
        if (!['UNDER_REVIEW', 'VERIFICATION_SUBMITTED'].includes(inviteStatus)) return false;
      } else if (selectedVerificationFilter === 'Rejected') {
        if (inviteStatus !== 'REJECTED') return false;
      } else if (selectedVerificationFilter === 'Not Submitted') {
        if (['APPROVED', 'UNDER_REVIEW', 'VERIFICATION_SUBMITTED', 'REJECTED'].includes(inviteStatus)) return false;
      }
    }

    // 4. Center Filter
    if (selectedCenterFilter !== 'All') {
      if (centerName !== selectedCenterFilter) return false;
    }

    return true;
  });

  // Extract dynamically available centers
  const centerOptions = ['All', ...new Set(records.map(r => 
    r.userAccount?.coordinator_area 
      ? `ASN Raju Blood Centre, ${r.userAccount.coordinator_area}`
      : 'ASN Raju Blood Centre, Bhimavaram'
  ))];

  // Calculate stats cards metrics
  const totalCoordinators = records.length;
  const activeCoordinators = records.filter(r => r.computedState === 'Active').length;
  const awaitingVerification = records.filter(r => r.computedState === 'Verification Pending').length;
  const inactiveCoordinators = records.filter(r => r.computedState !== 'Active').length;

  // Pagination calculations
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset pagination to page 1 on filter changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // State Machine Timelines Helpers
  const renderInvitationTimeline = (invite, userAccount) => {
    const computedState = getComputedState(invite, userAccount);
    
    // Step 1: Created (Always Completed)
    const step1State = 'Completed';
    
    // Step 2: Email Sent
    let step2State = 'Not Reached';
    let step2Desc = 'Pending sending';
    if (invite.email_status === 'SENT') {
      step2State = 'Completed';
      step2Desc = invite.sent_at 
        ? `Email sent successfully on ${formatTimestamp(invite.sent_at)}`
        : 'Completed — historical event details unavailable';
    } else if (invite.email_status === 'FAILED') {
      step2State = 'Failed';
      step2Desc = `Email dispatch failed: ${invite.failure_reason || 'Dispatch error'}`;
    } else if (invite.email_status === 'SENDING') {
      step2State = 'Current';
      step2Desc = 'Sending email dispatch...';
    } else if (invite.status === 'APPROVED' && !invite.sent_at) {
      step2State = 'Completed';
      step2Desc = 'Completed — historical event details unavailable';
    }
    
    // Step 3: Link Opened
    let step3State = 'Not Reached';
    let step3Desc = 'Not opened yet';
    if (invite.link_opened_at) {
      step3State = 'Completed';
      step3Desc = `Link opened on ${formatTimestamp(invite.link_opened_at)}`;
    } else if (invite.status === 'APPROVED' || invite.accepted_at || userAccount) {
      step3State = 'Not Reached';
      step3Desc = 'Not tracked';
    } else if (invite.email_status === 'SENT') {
      step3State = 'Waiting';
      step3Desc = 'Awaiting link opening by recipient';
    }
    
    // Step 4: Accepted
    let step4State = 'Not Reached';
    let step4Desc = 'Not accepted yet';
    if (invite.accepted_at) {
      step4State = 'Completed';
      step4Desc = `Accepted on ${formatTimestamp(invite.accepted_at)}`;
    } else if (invite.status === 'APPROVED' || userAccount) {
      step4State = 'Completed';
      step4Desc = 'Completed — historical event details unavailable';
    } else if (invite.link_opened_at) {
      step4State = 'Waiting';
      step4Desc = 'Awaiting registration completion';
    }

    const getStateStyle = (state) => {
      if (state === 'Completed') return { dot: 'bg-emerald-500 border-emerald-600', text: 'text-slate-800' };
      if (state === 'Current') return { dot: 'bg-blue-500 border-blue-600 animate-pulse', text: 'text-blue-700 font-bold' };
      if (state === 'Waiting') return { dot: 'bg-amber-500 border-amber-600', text: 'text-slate-500' };
      if (state === 'Failed') return { dot: 'bg-rose-500 border-rose-600', text: 'text-rose-700 font-bold' };
      return { dot: 'bg-slate-200 border-slate-300', text: 'text-slate-400 font-medium' };
    };

    const getDotContent = (state) => {
      if (state === 'Completed') return '✓';
      if (state === 'Failed') return '!';
      return '';
    };

    return (
      <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step1State).dot}`}>
            {getDotContent(step1State)}
          </div>
          <div>
            <strong className="text-slate-800 block">Invitation Created</strong>
            <span className="text-[10px] text-slate-550">{formatTimestamp(invite.created_at)}</span>
          </div>
        </div>

        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step2State).dot}`}>
            {getDotContent(step2State)}
          </div>
          <div>
            <strong className={`block ${getStateStyle(step2State).text}`}>
              {invite.email_status === 'FAILED' ? 'Email Delivery Failed' : 'Invitation Email Sent'}
            </strong>
            <span className="text-[10px] text-slate-550">{step2Desc}</span>
          </div>
        </div>

        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step3State).dot}`}>
            {getDotContent(step3State)}
          </div>
          <div>
            <strong className={`block ${getStateStyle(step3State).text}`}>Invitation Link Opened</strong>
            <span className="text-[10px] text-slate-550">{step3Desc}</span>
          </div>
        </div>

        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step4State).dot}`}>
            {getDotContent(step4State)}
          </div>
          <div>
            <strong className={`block ${getStateStyle(step4State).text}`}>Invitation Accepted</strong>
            <span className="text-[10px] text-slate-550">{step4Desc}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificationTimeline = (invite) => {
    const inviteStatus = invite.status;

    // Step 1: Details Submitted
    let step1State = 'Not Reached';
    let step1Desc = 'Coordinator has not submitted verification details';
    if (invite.verification_submitted_at) {
      step1State = 'Completed';
      step1Desc = `Details submitted on ${formatTimestamp(invite.verification_submitted_at)}`;
    } else if (inviteStatus === 'APPROVED') {
      step1State = 'Completed';
      step1Desc = 'Completed — historical event details unavailable';
    }

    // Step 2: Administrator Review
    let step2State = 'Not Reached';
    let step2Desc = 'Awaiting review start';
    if (invite.reviewed_at) {
      step2State = 'Completed';
      step2Desc = `Review completed on ${formatTimestamp(invite.reviewed_at)}`;
    } else if (['APPROVED', 'REJECTED'].includes(inviteStatus)) {
      step2State = 'Completed';
      step2Desc = 'Completed — historical event details unavailable';
    } else if (['UNDER_REVIEW', 'VERIFICATION_SUBMITTED'].includes(inviteStatus)) {
      step2State = 'Current';
      step2Desc = 'Submitted details are waiting for administrator review';
    }

    // Step 3: Review Decision
    let step3State = 'Not Reached';
    let step3Desc = 'Awaiting review decision';
    if (inviteStatus === 'APPROVED') {
      step3State = 'Completed';
      step3Desc = invite.reviewed_at || invite.accepted_at
        ? `Verification completed and approved on ${formatTimestamp(invite.reviewed_at || invite.accepted_at)}`
        : 'Completed — historical event details unavailable';
    } else if (inviteStatus === 'REJECTED') {
      step3State = 'Failed';
      step3Desc = invite.reviewed_at
        ? `Verification rejected on ${formatTimestamp(invite.reviewed_at)}: ${invite.rejection_reason || 'Rejection reason not specified'}`
        : `Verification rejected: ${invite.rejection_reason || 'Rejection reason not specified'}`;
    }

    const getStateStyle = (state) => {
      if (state === 'Completed') return { dot: 'bg-emerald-500 border-emerald-600', text: 'text-slate-800' };
      if (state === 'Current') return { dot: 'bg-blue-500 border-blue-600 animate-pulse', text: 'text-blue-700 font-bold' };
      if (state === 'Waiting') return { dot: 'bg-amber-500 border-amber-600', text: 'text-slate-500' };
      if (state === 'Failed') return { dot: 'bg-rose-500 border-rose-600', text: 'text-rose-700 font-bold' };
      return { dot: 'bg-slate-200 border-slate-300', text: 'text-slate-400 font-medium' };
    };

    const getDotContent = (state) => {
      if (state === 'Completed') return '✓';
      if (state === 'Failed') return '!';
      return '';
    };

    return (
      <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step1State).dot}`}>
            {getDotContent(step1State)}
          </div>
          <div>
            <strong className="text-slate-800 block">Identity Details Submitted</strong>
            <span className="text-[10px] text-slate-500">{step1Desc}</span>
            {invite.verification_submitted_at && invite.verification_data && (
              <div className="mt-1 p-2.5 bg-white border border-slate-150 rounded-lg text-[10px] font-semibold text-slate-650 leading-relaxed max-w-xs">
                <div>Phone: {invite.verification_data.phone || 'N/A'}</div>
                <div>Employee ID: {invite.verification_data.employee_id || 'N/A'}</div>
                {invite.verification_data.notes && <div>Notes: {invite.verification_data.notes}</div>}
              </div>
            )}
            {!invite.verification_submitted_at && inviteStatus === 'APPROVED' && invite.verification_data && (
              <div className="mt-1 p-2.5 bg-white border border-slate-150 rounded-lg text-[10px] font-semibold text-slate-650 leading-relaxed max-w-xs">
                <div>Phone: {invite.verification_data.phone || 'N/A'}</div>
                <div>Employee ID: {invite.verification_data.employee_id || 'N/A'}</div>
                {invite.verification_data.notes && <div>Notes: {invite.verification_data.notes}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step2State).dot}`}>
            {getDotContent(step2State)}
          </div>
          <div>
            <strong className={`block ${getStateStyle(step2State).text}`}>Administrator Review</strong>
            <span className="text-[10px] text-slate-550">{step2Desc}</span>
          </div>
        </div>

        <div className="relative flex gap-3 text-xxs">
          <div className={`absolute -left-[21px] rounded-full h-3.5 w-3.5 border flex items-center justify-center shadow-sm text-[8px] text-white ${getStateStyle(step3State).dot}`}>
            {getDotContent(step3State)}
          </div>
          <div>
            <strong className={`block ${getStateStyle(step3State).text}`}>Review Decision</strong>
            <span className="text-[10px] text-slate-555">{step3Desc}</span>
          </div>
        </div>
      </div>
    );
  };

  const getAdminActionStatus = (currentRequests) => {
    if (!currentRequests || currentRequests.length === 0) {
      return {
        status: 'No Action Required',
        desc: 'Coordinator has no active cases requiring attention.',
        icon: '🟢',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        actions: []
      };
    }
    
    const overdueRequests = currentRequests.filter(req => {
      const ageMs = new Date() - new Date(req.assigned_at);
      const ageMinutes = Math.floor(ageMs / 60000);
      return req.assignment_status === 'ASSIGNED' && 
             ['DONOR_RESPONDED', 'APPROVED'].includes(req.request_status) && 
             ageMinutes > 15;
    });

    if (overdueRequests.length > 0) {
      return {
        status: 'Coordinator action overdue.',
        desc: 'Assigned coordinator has exceeded the allowed response window of 15 minutes without taking action.',
        icon: '🔴',
        color: 'text-rose-800 bg-rose-50 border-rose-200',
        actions: ['View Request', 'Send Reminder', 'Send Emergency Notification'],
        requests: overdueRequests
      };
    }

    const inProgressRequests = currentRequests.filter(req => req.assignment_status === 'IN_PROGRESS');
    if (inProgressRequests.length > 0) {
      return {
        status: 'Coordinator is handling this case.',
        desc: 'Coordinator is actively managing this case and coordinating with the donor.',
        icon: '🔵',
        color: 'text-blue-800 bg-blue-50 border-blue-200',
        actions: ['View Request', 'Send Reminder'],
        requests: inProgressRequests
      };
    }

    return {
      status: 'Currently Handling Case',
      desc: 'Coordinator is actively handling an assigned request.',
      icon: '🔵',
      color: 'text-blue-800 bg-blue-50 border-blue-200',
      actions: ['View Request', 'Send Reminder'],
      requests: currentRequests
    };
  };

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
    'Revoked': 'bg-slate-100 text-slate-600 border-slate-300',
    'Deleted': 'bg-rose-50 text-rose-700 border-rose-150 line-through'
  };

  return (
    <div className="page-stack">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader 
            title="Coordinator Management" 
            description="Invite blood center coordinators, assign center access, and review volunteer/employee verifications." 
          />
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm hover:shadow"
          >
            + Invite Coordinator
          </button>
        </div>

        {/* FEEDBACK STATUSES */}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* SUMMARY STATS CARDS */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Total Coordinators</span>
            <div className="text-2xl font-extrabold text-slate-800">{totalCoordinators}</div>
            <span className="text-xxs text-slate-400 font-medium">All database records</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Active Coordinators</span>
            <div className="text-2xl font-extrabold text-emerald-600">{activeCoordinators}</div>
            <span className="text-xxs text-slate-400 font-medium">Account status is ACTIVE</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Awaiting Verification</span>
            <div className="text-2xl font-extrabold text-amber-600">{awaitingVerification}</div>
            <span className="text-xxs text-slate-400 font-medium">Pending admin verification check</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Inactive Coordinators</span>
            <div className="text-2xl font-extrabold text-slate-500">{inactiveCoordinators}</div>
            <span className="text-xxs text-slate-400 font-medium">Account is NOT active</span>
          </div>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full xl:w-96">
            <input
              type="text"
              placeholder="Search by name, email, employee ID or centre..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 pl-3 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => handleFilterChange(setSelectedStatusFilter, e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-slate-50 cursor-pointer font-bold text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification:</label>
              <select
                value={selectedVerificationFilter}
                onChange={(e) => handleFilterChange(setSelectedVerificationFilter, e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-slate-50 cursor-pointer font-bold text-slate-700"
              >
                <option value="All">All Verifications</option>
                <option value="Approved">Approved</option>
                <option value="Under Review">Under Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Not Submitted">Not Submitted</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Centre:</label>
              <select
                value={selectedCenterFilter}
                onChange={(e) => handleFilterChange(setSelectedCenterFilter, e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-slate-50 cursor-pointer font-bold text-slate-700 max-w-xs"
              >
                {centerOptions.map(center => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="ml-auto xl:ml-0 px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* COORDINATORS LIST & TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {paginatedRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold text-xs">
              No matching coordinator records found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xxs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
                      <th className="py-3 px-4">Coordinator</th>
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Centre</th>
                      <th className="py-3 px-4 text-center">Verification Status</th>
                      <th className="py-3 px-4 text-center">Account Status</th>
                      <th className="py-3 px-4 text-center">Active Cases</th>
                      <th className="py-3 px-4 text-center">Completed Cases</th>
                      <th className="py-3 px-4">Joined On</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-155 font-semibold text-slate-700">
                    {paginatedRecords.map(({ invite, userAccount, computedState }) => {
                      const empId = invite.verification_data?.employee_id || '—';
                      const centerName = userAccount?.coordinator_area 
                        ? `ASN Raju Blood Centre, ${userAccount.coordinator_area}`
                        : 'ASN Raju Blood Centre, Bhimavaram';
                      
                      const availability = userAccount?.coordinator_availability || 'OFFLINE';
                      const availabilityColors = {
                        'AVAILABLE': 'bg-emerald-500',
                        'BUSY': 'bg-blue-500',
                        'OFFLINE': 'bg-slate-400'
                      };

                      const activeCases = userAccount?.active_cases_count ? parseInt(userAccount.active_cases_count, 10) : 0;
                      const completedCases = userAccount?.completed_cases_count ? parseInt(userAccount.completed_cases_count, 10) : 0;

                      return (
                        <tr key={invite.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="text-slate-900 text-xs font-bold flex items-center gap-1.5">
                                {invite.name}
                                {computedState === 'Active' && (
                                  <span className={`h-1.5 w-1.5 rounded-full ${availabilityColors[availability]}`} title={`Status: ${availability}`} />
                                )}
                              </span>
                              <span className="text-slate-400 font-mono text-[9px] mt-0.5">{invite.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{empId}</td>
                          <td className="py-3.5 px-4 max-w-[180px] truncate" title={centerName}>{centerName}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 border text-[9px] font-extrabold ${stateColors[computedState]}`}>
                              {computedState}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 border text-[9px] font-extrabold ${
                              userAccount?.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {userAccount ? userAccount.status : 'Pending Activation'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">{activeCases}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">{completedCases}</td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {userAccount ? new Date(userAccount.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-center gap-1">
                              {userAccount ? (
                                <button
                                  onClick={() => handleViewDetails(userAccount.id)}
                                  disabled={loadingDetails && activeLoadingId === userAccount.id}
                                  className="rounded bg-slate-50 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-center w-28"
                                >
                                  {loadingDetails && activeLoadingId === userAccount.id ? 'Loading...' : 'View Details'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCoordDetails({ invite, user: null, profile: null, stats: null });
                                    setShowDetailsModal(true);
                                  }}
                                  className="rounded bg-slate-50 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-center w-28"
                                >
                                  View Details
                                </button>
                              )}

                              {userAccount ? (
                                userAccount.status === 'ACTIVE' ? (
                                  <button
                                    onClick={() => handleStatusToggle(userAccount.id, invite.email, 'INACTIVE', activeCases)}
                                    disabled={actioning}
                                    className="rounded bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer text-center w-28"
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusToggle(userAccount.id, invite.email, 'ACTIVE', 0)}
                                    disabled={actioning}
                                    className="rounded bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer text-center w-28"
                                  >
                                    Activate
                                  </button>
                                )
                              ) : (
                                <span className="text-slate-400 font-bold block text-center w-28">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT CARDS */}
              <div className="block lg:hidden divide-y divide-slate-150">
                {paginatedRecords.map(({ invite, userAccount, computedState }) => {
                  const empId = invite.verification_data?.employee_id || '—';
                  const centerName = userAccount?.coordinator_area 
                    ? `ASN Raju Blood Centre, ${userAccount.coordinator_area}`
                    : 'ASN Raju Blood Centre, Bhimavaram';
                  
                  const activeCases = userAccount?.active_cases_count ? parseInt(userAccount.active_cases_count, 10) : 0;
                  const completedCases = userAccount?.completed_cases_count ? parseInt(userAccount.completed_cases_count, 10) : 0;

                  return (
                    <div key={invite.id} className="p-4 space-y-3 bg-white text-xxs font-semibold text-slate-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-900 font-bold text-xs">{invite.name}</h4>
                          <span className="text-slate-400 font-mono text-[9px] block mt-0.5">{invite.email}</span>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 border text-[9px] font-extrabold ${stateColors[computedState]}`}>
                          {computedState}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xxs">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Employee ID</span>
                          <span className="text-slate-800 font-bold">{empId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Centre</span>
                          <span className="text-slate-800">{centerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Active Cases</span>
                          <span className="text-slate-800 font-extrabold">{activeCases}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Completed Cases</span>
                          <span className="text-slate-800 font-extrabold">{completedCases}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                        {userAccount ? (
                          <button
                            onClick={() => handleViewDetails(userAccount.id)}
                            disabled={loadingDetails && activeLoadingId === userAccount.id}
                            className="rounded bg-slate-50 px-3 py-1.5 font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
                          >
                            {loadingDetails && activeLoadingId === userAccount.id ? 'Loading...' : 'View Details'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCoordDetails({ invite, user: null, profile: null, stats: null });
                              setShowDetailsModal(true);
                            }}
                            className="rounded bg-slate-50 px-3 py-1.5 font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
                          >
                            View Details
                          </button>
                        )}

                        {userAccount ? (
                          userAccount.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusToggle(userAccount.id, invite.email, 'INACTIVE', activeCases)}
                              disabled={actioning}
                              className="rounded bg-rose-50 px-3 py-1.5 font-bold text-rose-700 border border-rose-200 transition cursor-pointer text-center"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(userAccount.id, invite.email, 'ACTIVE', 0)}
                              disabled={actioning}
                              className="rounded bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 border border-emerald-200 transition cursor-pointer text-center"
                            >
                              Activate
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION TOOLBAR */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-slate-200 gap-3 text-xxs font-bold text-slate-550 select-none">
                  <div>
                    Showing {startIndex + 1} to {endIndex} of {totalRecords} coordinators
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer text-slate-700"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          currentPage === page
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer text-slate-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* INVITE COORDINATOR MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Invite Coordinator</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  disabled={actioning}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. suresh@asnraju.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={actioning}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xxs text-slate-500 leading-normal">
                📍 Assigned Centre: <strong>ASN Raju Blood Centre, Bhimavaram</strong>
              </div>
              
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg bg-slate-50 px-4 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actioning}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xxs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                >
                  {actioning ? 'Sending...' : 'Send Coordinator Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL DETAILS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100 flex flex-col space-y-6">
            
            {/* Top of Details Modal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Coordinator Details</h3>
                {selectedCoordDetails?.invite && (
                  <span className="text-xxs text-slate-455 block font-mono mt-0.5">
                    {selectedCoordDetails.invite.name} · {selectedCoordDetails.invite.email}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 text-[10px] font-extrabold">
                {/* Account Status Pill */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                  selectedCoordDetails?.user?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  Account: {selectedCoordDetails?.user?.status === 'ACTIVE' ? '🟢 Active' : '⚪ Inactive'}
                </span>

                {/* Verification Status Pill */}
                {selectedCoordDetails?.invite && (() => {
                  const status = selectedCoordDetails.invite.status;
                  if (status === 'APPROVED') {
                    return (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-0.5 rounded-full">
                        Verification: 🟢 Approved
                      </span>
                    );
                  }
                  if (['UNDER_REVIEW', 'VERIFICATION_SUBMITTED'].includes(status)) {
                    return (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-250 px-2.5 py-0.5 rounded-full">
                        Verification: 🟠 Waiting for Review
                      </span>
                    );
                  }
                  if (status === 'REJECTED') {
                    return (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-250 px-2.5 py-0.5 rounded-full">
                        Verification: 🔴 Rejected
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      Verification: ⚪ Not Submitted
                    </span>
                  );
                })()}

                {/* Availability Status Pill */}
                {selectedCoordDetails && (() => {
                  const avail = selectedCoordDetails.profile?.availability_status;
                  if (avail === 'AVAILABLE') {
                    return (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-0.5 rounded-full">
                        Availability: 🟢 Available
                      </span>
                    );
                  }
                  if (avail === 'BUSY') {
                    return (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-250 px-2.5 py-0.5 rounded-full">
                        Availability: 🔵 Busy
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      Availability: ⚪ Offline
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* ASYNC SPINNER */}
            {loadingDetails && !selectedCoordDetails && (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-xxs font-bold text-slate-455 uppercase tracking-wider animate-pulse">Fetching details...</span>
              </div>
            )}

            {/* ERROR AND RETRY FEEDBACK IN MODAL */}
            {modalErrorMsg && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-100 p-4 rounded-xl leading-relaxed max-w-md select-none">
                  ⚠️ {modalErrorMsg}
                </span>
                <button
                  onClick={() => handleViewDetails(selectedLoadingUserId)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xxs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                >
                  Retry Fetching Details
                </button>
              </div>
            )}

            {/* DATA CONTAINER */}
            {!loadingDetails && selectedCoordDetails && (
              <div className="space-y-6 divide-y divide-slate-200 text-xxs">
                
                {/* 1. Section: COORDINATOR (Identity) */}
                <div className="space-y-3 pt-4 first:pt-0">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Coordinator
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xxs leading-normal font-semibold text-slate-700">
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Full Name</strong>
                      <span className="text-slate-900 text-xs font-bold">{selectedCoordDetails.invite.name}</span>
                    </div>
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Official Email</strong>
                      <span className="text-slate-900 font-bold">{selectedCoordDetails.invite.email}</span>
                    </div>
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Phone</strong>
                      <span className="text-slate-900 font-bold">
                        {selectedCoordDetails.invite.verification_data?.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Employee ID</strong>
                      <span className="text-slate-900 font-mono font-bold">
                        {selectedCoordDetails.invite.verification_data?.employee_id || '—'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Coordinator Type</strong>
                      <span className="text-slate-800">
                        {selectedCoordDetails.invite.verification_data?.employee_id ? 'Employee' : 'Volunteer'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-455 block uppercase text-[9px] mb-0.5">Assigned Centre</strong>
                      <span className="text-slate-900 font-bold">ASN Raju Blood Centre, Bhimavaram</span>
                    </div>
                  </div>
                </div>

                {/* 2. Section: CURRENT SITUATION */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Current Situation
                  </h4>
                  
                  {(() => {
                    const situation = getAdminActionStatus(selectedCoordDetails.currentRequests);
                    
                    return (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-xxs leading-relaxed ${situation.color}`}>
                          <span className="text-lg">{situation.icon}</span>
                          <div>
                            <strong className="block text-xs font-bold uppercase tracking-wider mb-0.5">{situation.status}</strong>
                            <span>{situation.desc}</span>
                          </div>
                        </div>

                        {selectedCoordDetails.currentRequests && selectedCoordDetails.currentRequests.length > 0 && (
                          <div className="space-y-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455 block">Active Coordination Details</span>
                            {selectedCoordDetails.currentRequests.map(req => {
                              const ageMs = new Date() - new Date(req.assigned_at);
                              const ageMinutes = Math.floor(ageMs / 60000);
                              
                              const getAgeText = (assignedAt) => {
                                const diffMs = new Date() - new Date(assignedAt);
                                const mins = Math.floor(diffMs / 60000);
                                if (mins < 60) return `${mins} minutes ago`;
                                const hrs = Math.floor(mins / 60);
                                return `${hrs} hour(s) ago`;
                              };

                              return (
                                <div key={req.assignment_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-semibold text-slate-700">
                                  <div className="flex justify-between items-center">
                                    <strong className="text-slate-900 text-xs font-bold">Request #{req.request_id.slice(0, 8)}</strong>
                                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-100 text-[10px] font-bold text-blue-700">
                                      {translateStatus(req.assignment_status)}
                                    </span>
                                  </div>
                                  
                                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 leading-relaxed">
                                    <div>
                                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Patient</span>
                                      <span className="text-slate-900 font-bold">{req.patient_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Blood Group</span>
                                      <span className="text-slate-950 font-extrabold">{req.blood_group}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Units Needed</span>
                                      <span className="text-slate-900 font-extrabold">{req.required_units}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Location</span>
                                      <span className="text-slate-800">{req.location}</span>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[10px] text-slate-500 font-medium">
                                    <span>Assigned: {formatTimestamp(req.assigned_at)} ({getAgeText(req.assigned_at)})</span>
                                    <span className="font-bold">
                                      Current Status: <span className="text-blue-600">"{translateStatus(req.request_status)}"</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Section: VERIFICATION */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Verification
                  </h4>
                  
                  {(() => {
                    const status = selectedCoordDetails.invite.status;
                    let blockIcon = '⚪';
                    let blockTitle = 'Verification Not Submitted';
                    let blockDesc = 'Coordinator has not submitted verification details.';
                    let blockColor = 'text-slate-500 bg-slate-50 border-slate-200';

                    if (status === 'APPROVED') {
                      blockIcon = '🟢';
                      blockTitle = 'Verification Approved';
                      blockDesc = `Verification completed and approved by an administrator on ${formatTimestamp(selectedCoordDetails.invite.reviewed_at || selectedCoordDetails.invite.accepted_at)}.`;
                      blockColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
                    } else if (status === 'REJECTED') {
                      blockIcon = '🔴';
                      blockTitle = 'Verification Rejected';
                      blockDesc = `Verification rejected by an administrator. Rejection Reason: ${selectedCoordDetails.invite.rejection_reason || 'N/A'}`;
                      blockColor = 'text-rose-800 bg-rose-50 border-rose-200';
                    } else if (['UNDER_REVIEW', 'VERIFICATION_SUBMITTED'].includes(status)) {
                      blockIcon = '🟠';
                      blockTitle = 'Verification Pending';
                      blockDesc = 'Submitted details are waiting for administrator review.';
                      blockColor = 'text-amber-800 bg-amber-50 border-amber-200';
                    }

                    return (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-xxs leading-relaxed ${blockColor}`}>
                          <span className="text-lg">{blockIcon}</span>
                          <div>
                            <strong className="block text-xs font-bold uppercase tracking-wider mb-0.5">{blockTitle}</strong>
                            <span>{blockDesc}</span>
                          </div>
                        </div>

                        {renderVerificationTimeline(selectedCoordDetails.invite)}

                        {['Verification Pending', 'Under Review'].includes(getComputedState(selectedCoordDetails.invite, selectedCoordDetails.user)) && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setReviewInviteId(selectedCoordDetails.invite.id);
                                setShowReviewModal(true);
                              }}
                              className="rounded bg-blue-600 px-4 py-2 text-[10px] font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                            >
                              Review Onboarding Details
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Section: INVITATION */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Invitation
                  </h4>
                  
                  {(() => {
                    const computedState = getComputedState(selectedCoordDetails.invite, selectedCoordDetails.user);
                    let blockIcon = '⚪';
                    let blockTitle = 'Invitation Pending';
                    let blockDesc = 'Invitation has been created and is waiting for actions.';
                    let blockColor = 'text-slate-500 bg-slate-50 border-slate-200';

                    if (selectedCoordDetails.invite.accepted_at || selectedCoordDetails.user) {
                      blockIcon = '🟢';
                      blockTitle = 'Invitation Accepted';
                      blockDesc = `Coordinator accepted the invitation on ${formatTimestamp(selectedCoordDetails.invite.accepted_at)}.`;
                      blockColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
                    } else if (selectedCoordDetails.invite.email_status === 'FAILED') {
                      blockIcon = '🔴';
                      blockTitle = 'Email Delivery Failed';
                      blockDesc = 'The invitation email dispatch could not be delivered to the coordinator official inbox.';
                      blockColor = 'text-rose-800 bg-rose-50 border-rose-200';
                    } else if (['Invited', 'Link Opened', 'Email Failed'].includes(computedState)) {
                      blockIcon = '🟠';
                      blockTitle = 'Invitation Pending';
                      blockDesc = 'Invitation has been sent but has not yet been accepted by the coordinator.';
                      blockColor = 'text-amber-800 bg-amber-50 border-amber-200';
                    }

                    return (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-xxs leading-relaxed ${blockColor}`}>
                          <span className="text-lg">{blockIcon}</span>
                          <div>
                            <strong className="block text-xs font-bold uppercase tracking-wider mb-0.5">{blockTitle}</strong>
                            <span>{blockDesc}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 select-none">
                          <button
                            type="button"
                            onClick={() => setShowInviteHistory(prev => !prev)}
                            className="text-blue-600 hover:text-blue-700 font-bold text-xxs flex items-center gap-1 focus:outline-none cursor-pointer"
                          >
                            <span>{showInviteHistory ? '▼' : '▶'}</span>
                            <span>{showInviteHistory ? 'Hide Invitation Timeline' : 'View Invitation History'}</span>
                          </button>
                        </div>

                        {showInviteHistory && renderInvitationTimeline(selectedCoordDetails.invite, selectedCoordDetails.user)}

                        {/* Invitation Mutations Actions */}
                        {['Invited', 'Link Opened', 'Email Failed', 'Expired'].includes(computedState) && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={() => handleResend(selectedCoordDetails.invite.id, selectedCoordDetails.invite.email)}
                              disabled={actioning}
                              className="rounded bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                            >
                              Resend Invite
                            </button>
                            <button
                              onClick={() => {
                                setInvitationToDelete({
                                  id: selectedCoordDetails.invite.id,
                                  email: selectedCoordDetails.invite.email,
                                  role: selectedCoordDetails.invite.role,
                                  status: computedState,
                                  linkOpened: !!selectedCoordDetails.invite.link_opened_at
                                });
                              }}
                              className="rounded bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                            >
                              Delete Invite
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 5. Section: WORK SUMMARY */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Work Summary
                  </h4>
                  
                  {selectedCoordDetails.stats ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-center">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Requests Handled</span>
                          <div className="text-xl font-extrabold text-slate-800 mt-1">
                            {selectedCoordDetails.stats.requestsReviewed}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Donations Completed</span>
                          <div className="text-xl font-extrabold text-emerald-600 mt-1">
                            {selectedCoordDetails.stats.donationsRecorded}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Cases Resolved</span>
                          <div className="text-xl font-extrabold text-blue-600 mt-1">
                            {selectedCoordDetails.stats.requestsCompleted}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Cases Cancelled</span>
                          <div className="text-xl font-extrabold text-rose-600 mt-1">
                            {selectedCoordDetails.stats.requestsCancelled}
                          </div>
                        </div>
                      </div>

                      <div className="text-xxs font-bold text-slate-650 bg-slate-50 border border-slate-150 p-3 rounded-lg leading-relaxed select-none">
                        Performance summary: <span className="text-slate-900">
                          {selectedCoordDetails.stats.requestsCompleted > 0 
                            ? `This coordinator has successfully completed ${selectedCoordDetails.stats.requestsCompleted} case(s).`
                            : 'No completed coordination activity yet.'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-450 italic text-center py-4 bg-slate-50 rounded-xl border">
                      No metrics summary available.
                    </div>
                  )}
                </div>

                {/* 6. Section: COMPLETED DONATIONS */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Completed Donations
                  </h4>
                  
                  {selectedCoordDetails.donationHistory && selectedCoordDetails.donationHistory.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedCoordDetails.donationHistory.map(donation => (
                        <div key={donation.donation_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-semibold text-slate-700">
                          <div className="flex justify-between items-center border-b border-slate-150 pb-1">
                            <span className="text-slate-900 font-bold">Donor: {donation.donor_name}</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">Verified: Yes</span>
                          </div>
                          <div>Blood Group: <span className="text-slate-900 font-bold">{donation.blood_group}</span></div>
                          <div>Units: <span className="text-slate-900 font-bold">{donation.units} Unit(s)</span></div>
                          <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
                            Completed: {new Date(donation.donation_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 font-semibold text-center py-6 bg-slate-50 rounded-xl border border-slate-150">
                      No completed donations recorded for this coordinator.
                    </div>
                  )}
                </div>

                {/* 7. Section: ADMIN ACTION */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-l-2 border-blue-600 pl-2">
                    Admin Action
                  </h4>
                  
                  {(() => {
                    const situation = getAdminActionStatus(selectedCoordDetails.currentRequests);
                    
                    return (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border flex items-center gap-3 font-semibold text-xxs leading-relaxed ${situation.color}`}>
                          <span className="text-lg">{situation.icon}</span>
                          <div>
                            <strong className="block text-xs font-bold uppercase tracking-wider mb-0.5">{situation.status}</strong>
                            <span>{situation.desc}</span>
                          </div>
                        </div>

                        {situation.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 pt-2 select-none">
                            {situation.actions.includes('View Request') && (
                              <a
                                href="/admin/requests"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-blue-50 px-4 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer text-center inline-block"
                              >
                                View Request
                              </a>
                            )}
                            {situation.actions.includes('Send Reminder') && (
                              <button
                                onClick={() => handleSendReminder(situation.requests?.[0]?.request_id)}
                                disabled={actioning || !situation.requests?.[0]?.request_id}
                                className="rounded bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-center disabled:opacity-50"
                              >
                                {actioning ? 'Sending...' : 'Send Reminder'}
                              </button>
                            )}
                            {situation.actions.includes('Send Emergency Notification') && (
                              <button
                                onClick={() => handleSendEmergency(situation.requests?.[0]?.request_id)}
                                disabled={actioning || !situation.requests?.[0]?.request_id}
                                className="rounded bg-rose-50 px-4 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer text-center disabled:opacity-50"
                              >
                                {actioning ? 'Sending...' : 'Send Emergency Notification'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Close Button Panel */}
                <div className="pt-6 select-none flex justify-end">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedCoordDetails(null);
                      setModalErrorMsg(null);
                    }}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-5 py-2 text-xxs font-bold text-slate-700 border border-slate-200 cursor-pointer transition shadow-sm"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW COORDINATOR VERIFICATION MODAL */}
      {showReviewModal && reviewInviteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">Review Coordinator Onboarding</h3>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase">Review Feedback Notes</label>
              <textarea
                placeholder="Specify approval details, employee validation, or rejection reasons..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
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