import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';

const donorLinks = [
  { to: '/donor/dashboard', label: 'Dashboard', end: true },
  { to: '/donor/profile', label: 'Profile' },
  { to: '/donor/availability', label: 'Availability' },
  { to: '/donor/requests', label: 'Emergency Requests' },
  { to: '/donor/donation-history', label: 'Donation History' },
  { to: '/donor/notifications', label: 'Notifications' },
];

export default function DonorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell relative overflow-hidden min-h-screen">
      <MedicalBackground variant="simple" />
      <Navbar
        title="Gift of Life"
        subtitle="Donor area"
        links={[{ to: '/', label: 'Public Site', end: true }]}
        onLogout={handleLogout}
      />
      <div className="dashboard-shell relative z-10">
        <Sidebar title="Donor" links={donorLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}