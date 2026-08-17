import * as adminService from './service.js';

export async function getStats(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
}

export async function getActiveStaff(req, res, next) {
  try {
    const data = await adminService.getActiveStaffList();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getStaff(req, res, next) {
  try {
    const data = await adminService.getStaffAndInvitations();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function invite(req, res, next) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }
    if (!['ADMIN', 'COORDINATOR'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const result = await adminService.inviteStaff(req.user.id, { name, email, role });
    return res.status(201).json({
      message: 'Invitation sent successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function resendInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.resendStaffInvitation(req.user.id, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function revokeInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.revokeStaffInvitation(req.user.id, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function review(req, res, next) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    if (!action) {
      return res.status(400).json({ message: 'Action (APPROVE or REJECT) is required' });
    }
    const result = await adminService.reviewVerification(req.user.id, id, { action, notes });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status (ACTIVE or INACTIVE) is required' });
    }
    const result = await adminService.updateStaffStatus(req.user.id, id, { status });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, search, action, actor, category, entityType, dateFrom, dateTo } = req.query;
    const result = await adminService.getLogs({
      page,
      limit,
      search,
      action,
      actor,
      category,
      entityType,
      dateFrom,
      dateTo
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteAuditLogs(req, res, next) {
  try {
    const actorId = req.user.id;
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Audit log IDs array is required' });
    }
    
    const result = await adminService.deleteLogs(actorId, ids);
    return res.status(200).json({
      message: `${result.count} audit logs successfully deleted.`,
      count: result.count,
      deletedIds: result.deletedIds
    });
  } catch (error) {
    next(error);
  }
}

export async function getCoordinatorDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await adminService.getCoordinatorDetails(req.user.id, id);
    return res.status(200).json(details);
  } catch (error) {
    next(error);
  }
}

export async function deleteInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.deleteStaffInvitation(req.user.id, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDonors(req, res, next) {
  try {
    const { search, bloodGroup, availability, sort } = req.query;
    const data = await adminService.getDonors({ search, bloodGroup, availability, sort });
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
}

export async function getDonorDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await adminService.getDonorDetails(req.user.id, id);
    return res.status(200).json({
      success: true,
      ...details
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const { search, bloodGroup, urgency, status, location, dateFrom, dateTo, sort } = req.query;
    const data = await adminService.getRequests({ search, bloodGroup, urgency, status, location, dateFrom, dateTo, sort });
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequestDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await adminService.getRequestDetails(req.user.id, id);
    return res.status(200).json({
      success: true,
      ...details
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveCoordinators(req, res, next) {
  try {
    const coordinators = await adminService.getActiveCoordinatorsList();
    return res.status(200).json({
      success: true,
      coordinators
    });
  } catch (error) {
    next(error);
  }
}

export async function assignRequestCoordinator(req, res, next) {
  try {
    const { id } = req.params;
    const { coordinatorId } = req.body;
    if (!coordinatorId) {
      return res.status(400).json({ success: false, message: 'Coordinator ID is required' });
    }
    const result = await adminService.assignRequestCoordinator(req.user.id, id, { coordinatorId });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelBloodRequest(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.cancelBloodRequest(req.user.id, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDonations(req, res, next) {
  try {
    const { page, limit, search, bloodGroupId, coordinatorId } = req.query;
    const result = await adminService.getDonationsList({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      search: search || '',
      bloodGroupId: bloodGroupId || '',
      coordinatorId: coordinatorId || ''
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getDonationStats(req, res, next) {
  try {
    const stats = await adminService.getDonationsSummaryStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getReports(req, res, next) {
  try {
    const { period } = req.query;
    const result = await adminService.getAdminReportsData(period || 'all_time');
    return res.status(200).json({ success: true, reports: result });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const notifications = await adminService.getAdminNotifications(req.user.id);
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.markAdminNotificationRead(id, req.user.id);
    return res.status(200).json({ success: true, notification: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.deleteAdminNotification(req.user.id, id, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendEmergencyNotification(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.sendEmergencyNotification(req.user.id, id, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendCoordinatorReminder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.sendCoordinatorReminder(req.user.id, id, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reassignCoordinatorEscalation(req, res, next) {
  try {
    const { id } = req.params;
    const { newCoordinatorProfileId, reason } = req.body;
    const result = await adminService.reassignCoordinatorEscalation(req.user.id, id, req.user.id, { newCoordinatorProfileId, reason });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
