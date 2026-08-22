import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import CoordinatorLayout from '../layouts/CoordinatorLayout';
import DonorLayout from '../layouts/DonorLayout';
import PublicLayout from '../layouts/PublicLayout';
import ReceiverLayout from '../layouts/ReceiverLayout';
import About from '../pages/public/About';
import BloodAvailability from '../pages/public/BloodAvailability';
import BloodCamps from '../pages/public/BloodCamps';
import DonationEligibility from '../pages/public/DonationEligibility';
import Home from '../pages/public/Home';
import HowDonationWorks from '../pages/public/HowDonationWorks';
import Login from '../pages/public/Login';
import Signup from '../pages/public/Signup';
import SetupSuperAdmin from '../pages/public/SetupSuperAdmin';
import SelectRole from '../pages/public/SelectRole';
import VerifyAccount from '../pages/public/VerifyAccount';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import ChangePassword from '../pages/public/ChangePassword';
import AcceptInvitation from '../pages/public/AcceptInvitation';
import AdminDashboard from '../roles/admin/pages/AdminDashboard';
import ProfileAccount from '../roles/admin/pages/ProfileAccount';
import CoordinatorDashboard from '../roles/coordinator/pages/CoordinatorDashboard';
import DonorAvailability from '../roles/donor/pages/DonorAvailability';
import DonorDashboard from '../roles/donor/pages/DonorDashboard';
import DonorDonationHistory from '../roles/donor/pages/DonorDonationHistory';
import DonorNotifications from '../roles/donor/pages/DonorNotifications';
import DonorProfile from '../roles/donor/pages/DonorProfile';
import DonorRequests from '../roles/donor/pages/DonorRequests';
import AssignedRequests from '../roles/coordinator/pages/AssignedRequests';
import CoordinatorNotifications from '../roles/coordinator/pages/CoordinatorNotifications';
import DonorResponses from '../roles/coordinator/pages/DonorResponses';
import FollowUps from '../roles/coordinator/pages/FollowUps';
import CoordinatorRequestDetails from '../roles/coordinator/pages/RequestDetails';
import CoordinatorCamps from '../roles/coordinator/pages/Camps';
import CoordinatorBloodAvailability from '../roles/coordinator/pages/BloodAvailability';
import AdminCoordinatorManagement from '../roles/admin/pages/CoordinatorManagement';
import AdminManagement from '../roles/admin/pages/AdminManagement';
import AuditLog from '../roles/admin/pages/AuditLog';
import DonationManagement from '../roles/admin/pages/DonationManagement';
import DonorManagement from '../roles/admin/pages/DonorManagement';
import NotificationManagement from '../roles/admin/pages/NotificationManagement';
import ReceiverDashboard from '../roles/receiver/pages/ReceiverDashboard';
import MyRequests from '../roles/receiver/pages/MyRequests';
import ReceiverNotifications from '../roles/receiver/pages/ReceiverNotifications';
import ReceiverRequestDetails from '../roles/receiver/pages/RequestDetails';
import RequestBlood from '../roles/receiver/pages/RequestBlood';
import RequestHistory from '../roles/receiver/pages/RequestHistory';
import ReceiverProfile from '../roles/receiver/pages/ReceiverProfile';
import AdminDonorDetails from '../roles/admin/pages/AdminDonorDetails';
import AdminRequestDetails from '../roles/admin/pages/AdminRequestDetails';
import RequestManagement from '../roles/admin/pages/RequestManagement';
import Reports from '../roles/admin/pages/Reports';

import BloodBankAdminLayout from '../layouts/BloodBankAdminLayout';
import BloodBankAdminDashboard from '../roles/blood_bank_admin/pages/BloodBankAdminDashboard';
import BloodBankAdminRequestManagement from '../roles/blood_bank_admin/pages/RequestManagement';
import BloodBankAdminCreateRequest from '../roles/blood_bank_admin/pages/CreateRequest';
import BloodBankAdminRequestDetails from '../roles/blood_bank_admin/pages/RequestDetails';

function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="blood-availability" element={<BloodAvailability />} />
            <Route path="blood-camps" element={<BloodCamps />} />
            <Route path="donation-eligibility" element={<DonationEligibility />} />
            <Route path="how-donation-works" element={<HowDonationWorks />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="setup-super-admin" element={<SetupSuperAdmin />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="accept-invite" element={<AcceptInvitation />} />
          </Route>

          <Route
            path="verify-account"
            element={
              <ProtectedRoute>
                <VerifyAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path="select-role"
            element={
              <ProtectedRoute>
                <SelectRole />
              </ProtectedRoute>
            }
          />

          <Route
            path="change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="donor"
            element={
              <ProtectedRoute requiredRole="DONOR">
                <DonorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DonorDashboard />} />
            <Route path="profile" element={<DonorProfile />} />
            <Route path="requests" element={<DonorRequests />} />
            <Route path="donation-history" element={<DonorDonationHistory />} />
            <Route path="notifications" element={<DonorNotifications />} />
          </Route>

          <Route
            path="receiver"
            element={
              <ProtectedRoute requiredRole="RECEIVER">
                <ReceiverLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ReceiverDashboard />} />
            <Route path="request-blood" element={<RequestBlood />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="requests/:id" element={<ReceiverRequestDetails />} />
            <Route path="history" element={<RequestHistory />} />
            <Route path="notifications" element={<ReceiverNotifications />} />
            <Route path="profile" element={<ReceiverProfile />} />
          </Route>

          <Route
            path="coordinator"
            element={
              <ProtectedRoute requiredRole="COORDINATOR">
                <CoordinatorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CoordinatorDashboard />} />
            <Route path="requests" element={<AssignedRequests />} />
            <Route path="requests/:id" element={<CoordinatorRequestDetails />} />
            <Route path="donor-responses" element={<DonorResponses />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="notifications" element={<CoordinatorNotifications />} />
            <Route path="profile" element={<ProfileAccount />} />
            <Route path="public-site/camps" element={<CoordinatorCamps />} />
            <Route path="public-site/blood-availability" element={<CoordinatorBloodAvailability />} />
          </Route>

          <Route
            path="blood-bank-admin"
            element={
              <ProtectedRoute requiredRole="BLOOD_BANK_ADMIN">
                <BloodBankAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BloodBankAdminDashboard />} />
            <Route path="requests" element={<BloodBankAdminRequestManagement />} />
            <Route path="requests/create" element={<BloodBankAdminCreateRequest />} />
            <Route path="requests/:id" element={<BloodBankAdminRequestDetails />} />
            <Route path="profile" element={<ProfileAccount />} />
          </Route>

          <Route
            path="super-admin"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="donors" element={<DonorManagement />} />
            <Route path="donors/:id" element={<AdminDonorDetails />} />
            <Route path="requests" element={<RequestManagement />} />
            <Route path="requests/:id" element={<AdminRequestDetails />} />
            <Route path="coordinators" element={<AdminCoordinatorManagement />} />
            <Route path="admins" element={<AdminManagement />} />
            <Route path="donations" element={<DonationManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="audit-logs" element={<AuditLog />} />
            <Route path="profile" element={<ProfileAccount />} />
          </Route>

          {/* Backwards compatibility redirect */}
          <Route path="admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppRoutes;