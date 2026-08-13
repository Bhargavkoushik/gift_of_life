import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/donors', label: 'Donors' },
  { to: '/admin/requests', label: 'Requests' },
  { to: '/admin/coordinators', label: 'Coordinators' },
  { to: '/admin/donations', label: 'Donations' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/notifications', label: 'Notifications' },
];

export default function AdminLayout() {
  return (
    <div className="app-shell">
      <Navbar title="Gift of Life" subtitle="Admin area" links={[{ to: '/', label: 'Public Site', end: true }]} />
      <div className="dashboard-shell">
        <Sidebar title="Admin" links={adminLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}