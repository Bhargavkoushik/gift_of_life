import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';

const receiverLinks = [
  { to: '/receiver/dashboard', label: 'Dashboard', end: true },
  { to: '/receiver/request-blood', label: 'Request Blood' },
  { to: '/receiver/requests', label: 'My Requests' },
  { to: '/receiver/history', label: 'Request History' },
  { to: '/receiver/notifications', label: 'Notifications' },
];

export default function ReceiverLayout() {
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
        subtitle="Receiver area"
        links={[{ to: '/', label: 'Public Site', end: true }]}
        onLogout={handleLogout}
      />
      <div className="dashboard-shell relative z-10">
        <Sidebar title="Receiver" links={receiverLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}