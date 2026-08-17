import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import { useAuth } from '../context/AuthContext';
import MedicalBackground from '../components/MedicalBackground';

export default function CoordinatorLayout() {
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [publicSiteExpanded, setPublicSiteExpanded] = useState(false);

  // Sign Out confirmation modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const modalRef = useRef(null);

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
    setConfirmText('');
    setLogoutError(null);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
    setConfirmText('');
    setLogoutError(null);
  };

  const handleConfirmLogout = async () => {
    if (confirmText !== 'SIGNOUT') return;
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

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (confirmText === 'SIGNOUT' && !loggingOut) {
        handleConfirmLogout();
      } else {
        e.preventDefault();
      }
    }
  };

  // Esc key for logout modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutModal(false);
        setConfirmText('');
        setLogoutError(null);
      }
    };
    if (showLogoutModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutModal]);

  // Focus trap for logout modal
  useEffect(() => {
    if (!showLogoutModal) return;
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabTrap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleTabTrap);
    const input = modalElement.querySelector('input');
    if (input) input.focus();

    return () => {
      modalElement.removeEventListener('keydown', handleTabTrap);
    };
  }, [showLogoutModal]);

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
    { to: '/coordinator/follow-ups', label: 'Follow-ups' },
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
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Profile Info */}
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

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs"
          >
            <h3 id="logout-modal-title" className="text-sm font-black text-slate-900 select-none">
              Confirm Sign Out
            </h3>
            
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              You are about to sign out of the Coordinator Workspace. This will end your current session.
            </p>
            
            {logoutError && (
              <p className="text-rose-600 font-bold text-[10px] select-none">
                ⚠️ {logoutError}
              </p>
            )}

            <div className="space-y-1.5">
              <label 
                htmlFor="signout-confirm-input" 
                className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block select-none"
              >
                Type SIGNOUT to confirm
              </label>
              <input
                id="signout-confirm-input"
                type="text"
                autoFocus
                placeholder="Type SIGNOUT"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                disabled={loggingOut}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={handleCancelLogout}
                disabled={loggingOut}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={confirmText !== 'SIGNOUT' || loggingOut}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}