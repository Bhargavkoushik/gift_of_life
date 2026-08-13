import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const receiverLinks = [
  { to: '/receiver/dashboard', label: 'Dashboard', end: true },
  { to: '/receiver/request-blood', label: 'Request Blood' },
  { to: '/receiver/requests', label: 'My Requests' },
  { to: '/receiver/history', label: 'Request History' },
  { to: '/receiver/notifications', label: 'Notifications' },
];

export default function ReceiverLayout() {
  return (
    <div className="app-shell">
      <Navbar title="Gift of Life" subtitle="Receiver area" links={[{ to: '/', label: 'Public Site', end: true }]} />
      <div className="dashboard-shell">
        <Sidebar title="Receiver" links={receiverLinks} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}