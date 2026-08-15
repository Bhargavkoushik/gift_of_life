import * as adminService from './service.js';

export async function getStats(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({ stats });
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
    const logs = await adminService.getLogs();
    return res.status(200).json({ logs });
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
