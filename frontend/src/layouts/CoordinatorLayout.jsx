import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';

const coordinatorLinks = [
  { to: '/coordinator/dashboard', label: 'Dashboard', end: true },
  { to: '/coordinator/requests', label: 'Assigned Requests' },
  { to: '/coordinator/donor-responses', label: 'Donor Responses' },
  { to: '/coordinator/follow-ups', label: 'Follow-ups' },
  { to: '/coordinator/notifications', label: 'Notifications' },
];

export default function CoordinatorLayout() {
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
        subtitle="Coordinator area"
        links={[{ to: '/', label: 'Public Site', end: true }]}
        onLogout={handleLogout}
      />
      <div className="dashboard-shell relative z-10">
        <Sidebar title="Coordinator" links={coordinatorLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}