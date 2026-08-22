import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';

const bloodBankAdminLinks = [
  { to: '/blood-bank-admin/dashboard', label: 'Dashboard', end: true },
  { to: '/blood-bank-admin/requests/create', label: 'Create Request' },
  { to: '/blood-bank-admin/requests', label: 'Manage Requests' },
  { to: '/blood-bank-admin/profile', label: 'My Profile' },
];

export default function BloodBankAdminLayout() {
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
        subtitle="Blood Bank Admin Area"
        links={[{ to: '/', label: 'Public Site', end: true }]}
        onLogout={handleLogout}
      />
      <div className="dashboard-shell relative z-10">
        <Sidebar title="Blood Bank Admin" links={bloodBankAdminLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
