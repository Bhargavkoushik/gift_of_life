import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MedicalBackground from '../components/MedicalBackground';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

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
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Maintain donor route history for back-button fallback logic
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/donor')) {
      try {
        const historyStr = sessionStorage.getItem('donorHistory');
        let history = historyStr ? JSON.parse(historyStr) : [];
        if (history[history.length - 1] !== currentPath) {
          history.push(currentPath);
          if (history.length > 20) {
            history.shift();
          }
          sessionStorage.setItem('donorHistory', JSON.stringify(history));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell relative overflow-hidden min-h-screen">
      <MedicalBackground variant="simple" />
      
      {/* Header bar */}
      <header className="topbar">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Gift of Life Logo" className="h-16 w-16 object-contain rounded-lg shrink-0" />
            <div className="brand">
              <span className="brand-name">Gift of Life</span>
              <span className="brand-meta">Donor Area</span>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/" className="nav-link">
              Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="nav-link bg-transparent border-none cursor-pointer font-sans font-semibold hover:text-brand-red transition"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open donor menu"
            className="block lg:hidden p-2 text-slate-600 hover:text-brand-red cursor-pointer focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30"
          />
          <div className="fixed top-0 bottom-0 left-0 w-[280px] bg-white z-40 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Logo" className="h-12 w-12 object-contain rounded" />
                  <span className="text-sm font-bold uppercase tracking-wider text-brand-red">DONOR MENU</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close donor menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer focus:outline-none"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-1.5" aria-label="Donor Drawer Navigation">
                {donorLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setIsDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition min-h-[44px] ${
                        isActive
                          ? 'bg-brand-red text-white border-l-4 border-brand-red-dark shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-brand-red border-l-4 border-transparent'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2">
              <Link
                to="/"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 min-h-[44px] transition"
              >
                Public Site
              </Link>
              <Link
                to="/change-password"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 min-h-[44px] transition"
              >
                Account Settings
              </Link>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 min-h-[44px] text-left cursor-pointer transition w-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main layout */}
      <div className="dashboard-shell relative z-10">
        {/* Sidebar is hidden on mobile and tablet (below lg breakpoint) */}
        <div className="hidden lg:block">
          <Sidebar title="Donor" links={donorLinks} />
        </div>
        
        <main className="content-area">
          <BackButton />
          <Outlet />
        </main>
      </div>
    </div>
  );
}