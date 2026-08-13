import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/blood-availability', label: 'Blood Availability' },
  { to: '/blood-banks', label: 'Blood Banks' },
  { to: '/blood-camps', label: 'Blood Camps' },
  { to: '/donation-eligibility', label: 'Who Can Donate' },
  { to: '/how-donation-works', label: 'How Donation Works' },
  { to: '/login', label: 'Login' },
];

export default function PublicLayout() {
  return (
    <div className="app-shell">
      <Navbar title="Gift of Life" subtitle="Public information area" links={publicLinks} />
      <main className="page-shell">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>Gift of Life</span>
          <span>Public reference pages for the blood donation platform.</span>
        </div>
      </footer>
    </div>
  );
}