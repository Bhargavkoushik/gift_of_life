import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink, Link } from 'react-router-dom';
import MedicalBackground from '../components/MedicalBackground';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

const receiverLinks = [
  { to: '/receiver/dashboard', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: '/receiver/request-blood', label: 'Request Blood', icon: 'add' },
  { to: '/receiver/requests', label: 'Ongoing Requests', icon: 'active' },
  { to: '/receiver/history', label: 'Past Requests', icon: 'history' },
  { to: '/receiver/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/receiver/profile', label: 'Profile', icon: 'profile' },
];

export default function ReceiverLayout() {
  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSourceOverride, setActiveSourceOverride] = useState(null);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Reset override when location pathname changes (excluding sub-routes if desired, handled by detail page mounting)
  useEffect(() => {
    setActiveSourceOverride(null);
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

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isLinkActive = (link) => {
    if (activeSourceOverride) {
      if (link.icon === 'dashboard') return activeSourceOverride === 'dashboard';
      if (link.icon === 'active') return activeSourceOverride === 'ongoing';
      if (link.icon === 'history') return activeSourceOverride === 'past';
    }
    
    // Normal routing active check
    const currentPath = location.pathname;
    if (link.end) {
      return currentPath === link.to;
    }
    if (link.to === '/receiver/requests') {
      return currentPath.startsWith('/receiver/requests') && !currentPath.match(/\/requests\/.+/);
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
      case 'add':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'active':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'history':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'profile':
        return (
          <svg className={`h-4.5 w-4.5 ${strokeColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const navLinksContent = (onLinkClick) => (
    <nav className="flex flex-col gap-1 font-sans" aria-label="Receiver navigation">
      {receiverLinks.map((link) => {
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
                  ? 'bg-rose-50 text-brand-red'
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
              <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Receiver Workspace</span>
            </div>
          </div>
          {navLinksContent()}
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div className="min-w-0 flex-1 leading-none">
              <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name || 'Receiver'}</div>
              <div className="text-[10px] font-semibold text-slate-450 truncate mt-0.5">{currentUser?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
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
        
        {/* MOBILE STICKY HEADER */}
        <header className="flex lg:hidden items-center justify-between h-16 bg-white border-b border-slate-200 px-4 sticky top-0 z-30 shadow-xxs">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain rounded" />
            <span className="text-xs font-black text-brand-red uppercase tracking-wider">Gift of Life Receiver</span>
          </div>

          <div className="w-10 h-10" />
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
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Receiver Drawer</span>
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
                {navLinksContent(() => setIsDrawerOpen(false))}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs shrink-0">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'R'}
                  </div>
                  <div className="min-w-0 flex-1 leading-none">
                    <div className="text-xxs font-black text-slate-800 truncate">{currentUser?.name}</div>
                    <div className="text-[10px] font-semibold text-slate-405 truncate mt-0.5">{currentUser?.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xxs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-sans"
                >
                  <svg className="h-4 w-4 stroke-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* CONTENT MAIN OUTLET */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ setActiveSourceOverride }} />
        </main>
      </div>
    </div>
  );
}