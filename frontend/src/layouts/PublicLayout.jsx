import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';

const baseLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/blood-availability', label: 'Blood Availability' },
  { to: '/blood-banks', label: 'Blood Banks' },
  { to: '/blood-camps', label: 'Blood Camps' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const links = [
    ...baseLinks,
    user 
      ? { to: '/select-role', label: 'Account' }
      : { to: '/login', label: 'Login' }
  ];

  return (
    <div className="app-shell relative overflow-hidden min-h-screen bg-slate-50">
      <MedicalBackground variant={isHome ? 'full' : 'simple'} />
      <Navbar title="Gift of Life" subtitle="Public information area" links={links} />
      <main className="page-shell relative z-10">
        <Outlet />
      </main>
      <footer className="footer relative z-10 border-t border-slate-200 bg-white/90 backdrop-blur-sm py-10 px-4">
        <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-600">
          <div className="space-y-3">
            <div className="text-base font-bold text-brand-red">Gift of Life</div>
            <div className="text-xs text-slate-500 font-medium">Blood Donation Platform</div>
            <div className="text-xs text-slate-400 mt-4">&copy; {new Date().getFullYear()} Gift of Life. All rights reserved.</div>
          </div>
          
          <div className="space-y-3">
            <div className="font-semibold text-slate-950 uppercase tracking-wider text-xs">Quick Links</div>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/" className="hover:text-brand-red transition">Home</Link></li>
              <li><Link to="/blood-availability" className="hover:text-brand-red transition">Blood Availability</Link></li>
              <li><Link to="/blood-banks" className="hover:text-brand-red transition">Blood Banks</Link></li>
              <li><Link to="/blood-camps" className="hover:text-brand-red transition">Blood Camps</Link></li>
              <li><Link to="/donation-eligibility" className="hover:text-brand-red transition">Donation Eligibility</Link></li>
              <li><Link to="/how-donation-works" className="hover:text-brand-red transition">How Donation Works</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-slate-950 uppercase tracking-wider text-xs">Get Involved</div>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/select-role" className="hover:text-brand-red transition">Become a Donor</Link></li>
              <li><Link to="/select-role" className="hover:text-brand-red transition">Request Blood</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-slate-950 uppercase tracking-wider text-xs">About</div>
            <ul className="space-y-2 text-xs font-medium font-sans">
              <li className="font-semibold text-slate-800">ASN Raju Blood Bank</li>
              <li className="text-slate-500 italic">Contact & organization details will be updated here once available.</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}