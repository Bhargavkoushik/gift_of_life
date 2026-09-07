import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink, Link } from 'react-router-dom';
import MedicalBackground from '../components/MedicalBackground';
import BackButton from '../components/BackButton';
import SignOutModal from '../components/SignOutModal';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

const adminLinks = [
  { to: '/blood-bank-admin/dashboard', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: '/blood-bank-admin/requests', label: 'Blood Requests', icon: 'requests' },
  { to: '/blood-bank-admin/donors', label: 'Donors', icon: 'donors' },
  { to: '/blood-bank-admin/coordinators', label: 'Coordinators', icon: 'coordinators' },
  { to: '/blood-bank-admin/profile', label: 'Profile', icon: 'profile' },
  { to: '/change-password', label: 'Change Password', icon: 'key' },
];

export default function BloodBankAdminLayout() {
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setLogoutError(null);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout(false);
      setShowLogoutModal(false);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setLogoutError('Unable to sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const isLinkActive = (link) => {
    const currentPath = location.pathname;
    
    // Custom logic to prevent double highlighting of Manage Requests and Create Request
    if (link.to === '/blood-bank-admin/requests') {
      return currentPath.startsWith('/blood-bank-admin/requests') && currentPath !== '/blood-bank-admin/requests/create';
    }
    
    if (link.end) {
      return currentPath === link.to;
    }
    return currentPath.startsWith(link.to);
  };

  const getLinkIcon = (iconName, isActive) => {
    const strokeColor = isActive ? 'stroke-brand-red' : 'stroke-slate-500 hover:stroke-slate-900';
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'requests':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'donors':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'coordinators':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'profile':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'key':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const navLinksContent = (onLinkClick) => (
    <nav className="flex flex-col gap-1 font-sans" aria-label="Admin navigation">
      {adminLinks.map((link) => {
        const active = isLinkActive(link);
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onLinkClick}
            className={() =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition ${
                active
                  ? 'bg-rose-50 text-brand-red animate-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {getLinkIcon(link.icon, active)}
            <span className="flex-1">{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden select-none">
      <MedicalBackground variant="simple" />

      {/* DESKTOP STICKY LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 h-screen sticky top-0 bg-white border-r border-slate-200 p-5 shrink-0 z-20">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
            <img src={logo} alt="Gift of Life Logo" className="h-8.5 w-8.5 object-contain rounded-lg shrink-0" />
            <div className="leading-none">
              <span className="text-xs font-black text-brand-red uppercase tracking-wider block">Gift of Life</span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Admin Workspace</span>
            </div>
          </div>
          {navLinksContent()}
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1 leading-none">
              <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name || 'Admin'}</div>
              <div className="text-[10px] font-semibold text-slate-450 truncate mt-0.5">{currentUser?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xxs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-sans"
          >
            <svg className="h-4 w-4 stroke-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE NAV LAYER & CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        
        {/* GLOBAL STICKY HEADER (Desktop & Mobile) */}
        <header className="flex items-center justify-between h-16 bg-white border-b border-slate-200 px-4 lg:px-6 sticky top-0 z-30 shadow-xxs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Branding */}
            <div className="flex lg:hidden items-center gap-2">
              <img src={logo} alt="Logo" className="h-8 w-8 object-contain rounded" />
              <span className="text-xs font-black text-brand-red uppercase tracking-wider">Gift of Life Admin</span>
            </div>

            {/* Desktop Brand descriptor */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Bank Admin Area</span>
            </div>
          </div>

          {/* Right Area: Public Site navigation link button */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xxs font-bold transition shadow-xxs cursor-pointer font-sans"
            >
              <svg className="h-3.5 w-3.5 stroke-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Public Site</span>
            </Link>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {isDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setIsDrawerOpen(false)}
            />
            <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl lg:hidden transform transition-transform duration-300 translate-x-0 border-r border-slate-200">
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="Logo" className="h-8 w-8 object-contain rounded" />
                    <div className="leading-none">
                      <span className="text-xs font-black text-brand-red uppercase block">Gift of Life</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Admin Drawer</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-850 transition cursor-pointer border border-slate-200"
                    aria-label="Close menu"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {navLinksContent(() => setIsDrawerOpen(false))}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0 flex-1 leading-none">
                    <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name}</div>
                    <div className="text-[10px] font-semibold text-slate-405 truncate mt-0.5">{currentUser?.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xxs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-sans"
                >
                  <svg className="h-4 w-4 stroke-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </>
        )}

        <main className="content-area flex-1 p-4 lg:p-6 overflow-y-auto">
          <BackButton />
          <Outlet />
        </main>
      </div>

      <SignOutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loggingOut={loggingOut}
        error={logoutError}
      />
    </div>
  );
}
