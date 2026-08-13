import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const donorLinks = [
  { to: '/donor/dashboard', label: 'Dashboard', end: true },
  { to: '/donor/profile', label: 'Profile' },
  { to: '/donor/availability', label: 'Availability' },
  { to: '/donor/requests', label: 'Emergency Requests' },
  { to: '/donor/donation-history', label: 'Donation History' },
  { to: '/donor/notifications', label: 'Notifications' },
];

export default function DonorLayout() {
  return (
    <div className="app-shell">
      <Navbar title="Gift of Life" subtitle="Donor area" links={[{ to: '/', label: 'Public Site', end: true }]} />
      <div className="dashboard-shell">
        <Sidebar title="Donor" links={donorLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}