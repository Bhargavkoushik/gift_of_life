import { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import { useAuth } from '../context/AuthContext';
import MedicalBackground from '../components/MedicalBackground';
import BackButton from '../components/BackButton';
import SignOutModal from '../components/SignOutModal';

export default function CoordinatorLayout() {
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [publicSiteExpanded, setPublicSiteExpanded] = useState(false);

  // Sign Out confirmation modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  // Close drawer on page navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Handle escape key to close drawer
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

  // Check if Public Site paths are active to expand Public Site collapsible section
  useEffect(() => {
    if (location.pathname.startsWith('/coordinator/public-site')) {
      setPublicSiteExpanded(true);
    }
  }, [location.pathname]);

  const navLinksList = [
    { to: '/coordinator/dashboard', label: 'Dashboard', end: true },
    { to: '/coordinator/requests', label: 'Assigned Requests' },
    { to: '/coordinator/donor-responses', label: 'Donor Responses' },
    { to: '/coordinator/follow-ups', label: 'Needs Attention' },
    { to: '/coordinator/notifications', label: 'Notifications' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden select-none">
      <MedicalBackground variant="simple" />

      {/* DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 h-screen sticky top-0 bg-white border-r border-slate-200 p-5 shrink-0 z-20">
        <div className="space-y-6">
          {/* Branding */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 select-none">
            <img src={logo} alt="Gift of Life Logo" className="h-9 w-9 object-contain rounded-lg shrink-0" />
            <div className="leading-none">
              <span className="text-xs font-black text-brand-red uppercase tracking-wider block">Gift of Life</span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Coordinator Workspace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4 font-sans" aria-label="Coordinator Desktop Navigation">
            <div>
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 select-none px-3">
                Workspace
              </h4>
              <div className="flex flex-col gap-0.5">
                {navLinksList.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-normal transition ${
                        isActive ? 'bg-rose-50 text-brand-red font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Public Site collapsible section */}
            <div>
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 select-none px-3">
                Public Site
              </h4>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setPublicSiteExpanded(!publicSiteExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-normal text-slate-655 hover:bg-slate-50 hover:text-slate-900 transition text-left cursor-pointer"
                >
                  <span>Public Site Management</span>
                  <svg
                    className={`h-3.5 w-3.5 transform transition-transform ${publicSiteExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {publicSiteExpanded && (
                  <div className="pl-4 flex flex-col gap-0.5 border-l border-slate-100 ml-3.5 mt-0.5">
                    <NavLink
                      to="/coordinator/public-site/camps"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive ? 'text-brand-red font-bold' : 'text-slate-550 hover:text-slate-800'
                        }`
                      }
                    >
                      Camps
                    </NavLink>
                    <NavLink
                      to="/coordinator/public-site/blood-availability"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive ? 'text-brand-red font-bold' : 'text-slate-550 hover:text-slate-800'
                        }`
                      }
                    >
                      Blood Availability
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {/* Profile Info */}
          <div className="space-y-1">
            <NavLink
              to="/coordinator/profile"
              className={({ isActive }) =>
                `flex items-center gap-2.5 p-2 rounded-xl border transition ${
                  isActive ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                }`
              }
            >
              <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0 select-none">
                {currentUser?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1 leading-none">
                <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name || 'Coordinator'}</div>
                <div className="text-[10px] font-semibold text-slate-450 truncate mt-0.5">{currentUser?.email}</div>
              </div>
            </NavLink>

            <NavLink
              to="/change-password"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xxs font-bold transition ${
                  isActive ? 'bg-rose-50 text-brand-red' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Change Password</span>
            </NavLink>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xxs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-sans"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE STICKY HEADER & MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        
        {/* MOBILE STICKY HEADER */}
        <header className="flex lg:hidden items-center justify-between h-16 bg-white border-b border-slate-200 px-4 sticky top-0 z-30 shadow-xxs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-lg text-slate-650 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Gift of Life Logo" className="h-8.5 w-8.5 object-contain rounded-lg shrink-0" />
              <div className="leading-none">
                <span className="text-xs font-black text-brand-red uppercase tracking-wider block">Gift of Life</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Coordinator Workspace</span>
              </div>
            </div>
          </div>

          <div>
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
              Public Site
            </Link>
          </div>
        </header>

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          <BackButton />
          <Outlet />
        </main>
      </div>

      {/* MOBILE ☰ MENU DRAWER */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl border-r border-slate-200 overflow-y-auto lg:hidden">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Logo" className="h-8 w-8 object-contain rounded" />
                  <div className="leading-none">
                    <span className="text-xs font-black text-brand-red uppercase block">☰ Menu</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Coordinator Drawer</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer border border-slate-200"
                  aria-label="Close menu"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-5 font-sans" aria-label="Coordinator Drawer Navigation">
                
                {/* WORKSPACE */}
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 select-none px-3">
                    Workspace
                  </h4>
                  <div className="flex flex-col gap-1">
                    {navLinksList.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition ${
                            isActive ? 'bg-rose-50 text-brand-red font-bold' : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>

                {/* PUBLIC SITE */}
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 select-none px-3">
                    Public Site
                  </h4>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setPublicSiteExpanded(!publicSiteExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal text-slate-655 hover:bg-slate-50 hover:text-slate-900 transition text-left cursor-pointer"
                    >
                      <span>Public Site Management</span>
                      <svg
                        className={`h-4 w-4 transform transition-transform ${publicSiteExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {publicSiteExpanded && (
                      <div className="pl-4 flex flex-col gap-0.5 border-l border-slate-100 ml-3.5 mt-0.5">
                        <NavLink
                          to="/coordinator/public-site/camps"
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                              isActive ? 'text-brand-red font-bold' : 'text-slate-550 hover:text-slate-800'
                            }`
                          }
                        >
                          Camps
                        </NavLink>
                        <NavLink
                          to="/coordinator/public-site/blood-availability"
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                              isActive ? 'text-brand-red font-bold' : 'text-slate-550 hover:text-slate-800'
                            }`
                          }
                        >
                          Blood Availability
                        </NavLink>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACCOUNT */}
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 select-none px-3">
                    Account
                  </h4>
                  <div className="flex flex-col gap-1">
                    <NavLink
                      to="/coordinator/profile"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition ${
                          isActive ? 'bg-rose-50 text-brand-red font-bold' : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      Profile / Account
                    </NavLink>
                    <NavLink
                      to="/change-password"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition ${
                          isActive ? 'bg-rose-50 text-brand-red font-bold' : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      Change Password
                    </NavLink>
                  </div>
                </div>

              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0 select-none">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 flex-1 leading-none">
                  <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name || 'Coordinator'}</div>
                  <div className="text-[10px] font-semibold text-slate-450 truncate mt-0.5">{currentUser?.email}</div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xxs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-sans"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

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