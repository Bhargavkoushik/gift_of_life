import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const coordinatorLinks = [
  { to: '/coordinator/dashboard', label: 'Dashboard', end: true },
  { to: '/coordinator/requests', label: 'Assigned Requests' },
  { to: '/coordinator/donor-responses', label: 'Donor Responses' },
  { to: '/coordinator/follow-ups', label: 'Follow-ups' },
  { to: '/coordinator/notifications', label: 'Notifications' },
];

export default function CoordinatorLayout() {
  return (
    <div className="app-shell">
      <Navbar title="Gift of Life" subtitle="Coordinator area" links={[{ to: '/', label: 'Public Site', end: true }]} />
      <div className="dashboard-shell">
        <Sidebar title="Coordinator" links={coordinatorLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}