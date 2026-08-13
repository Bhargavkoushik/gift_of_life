import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import CoordinatorLayout from '../layouts/CoordinatorLayout';
import DonorLayout from '../layouts/DonorLayout';
import PublicLayout from '../layouts/PublicLayout';
import ReceiverLayout from '../layouts/ReceiverLayout';
import About from '../pages/public/About';
import BloodAvailability from '../pages/public/BloodAvailability';
import BloodBanks from '../pages/public/BloodBanks';
import BloodCamps from '../pages/public/BloodCamps';
import DonationEligibility from '../pages/public/DonationEligibility';
import Home from '../pages/public/Home';
import HowDonationWorks from '../pages/public/HowDonationWorks';
import Login from '../pages/public/Login';
import AdminDashboard from '../roles/admin/pages/AdminDashboard';
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
import AdminCoordinatorManagement from '../roles/admin/pages/CoordinatorManagement';
import DonationManagement from '../roles/admin/pages/DonationManagement';
import DonorManagement from '../roles/admin/pages/DonorManagement';
import NotificationManagement from '../roles/admin/pages/NotificationManagement';
import ReceiverDashboard from '../roles/receiver/pages/ReceiverDashboard';
import MyRequests from '../roles/receiver/pages/MyRequests';
import ReceiverNotifications from '../roles/receiver/pages/ReceiverNotifications';
import ReceiverRequestDetails from '../roles/receiver/pages/RequestDetails';
import RequestBlood from '../roles/receiver/pages/RequestBlood';
import RequestHistory from '../roles/receiver/pages/RequestHistory';
import RequestManagement from '../roles/admin/pages/RequestManagement';
import Reports from '../roles/admin/pages/Reports';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="blood-availability" element={<BloodAvailability />} />
          <Route path="blood-banks" element={<BloodBanks />} />
          <Route path="blood-camps" element={<BloodCamps />} />
          <Route path="donation-eligibility" element={<DonationEligibility />} />
          <Route path="how-donation-works" element={<HowDonationWorks />} />
          <Route path="login" element={<Login />} />
        </Route>

        <Route path="donor" element={<DonorLayout />}>
          <Route path="dashboard" element={<DonorDashboard />} />
          <Route path="profile" element={<DonorProfile />} />
          <Route path="availability" element={<DonorAvailability />} />
          <Route path="requests" element={<DonorRequests />} />
          <Route path="donation-history" element={<DonorDonationHistory />} />
          <Route path="notifications" element={<DonorNotifications />} />
        </Route>

        <Route path="receiver" element={<ReceiverLayout />}>
          <Route path="dashboard" element={<ReceiverDashboard />} />
          <Route path="request-blood" element={<RequestBlood />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="requests/:id" element={<ReceiverRequestDetails />} />
          <Route path="history" element={<RequestHistory />} />
          <Route path="notifications" element={<ReceiverNotifications />} />
        </Route>

        <Route path="coordinator" element={<CoordinatorLayout />}>
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="requests" element={<AssignedRequests />} />
          <Route path="requests/:id" element={<CoordinatorRequestDetails />} />
          <Route path="donor-responses" element={<DonorResponses />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="notifications" element={<CoordinatorNotifications />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="donors" element={<DonorManagement />} />
          <Route path="requests" element={<RequestManagement />} />
          <Route path="coordinators" element={<AdminCoordinatorManagement />} />
          <Route path="donations" element={<DonationManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<NotificationManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;