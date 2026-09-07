import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the back button on the dashboard for the current workspace
  const isDashboard = 
    location.pathname === '/donor/dashboard' || 
    location.pathname === '/receiver/dashboard' || 
    location.pathname === '/coordinator/dashboard' || 
    location.pathname === '/blood-bank-admin/dashboard' ||
    location.pathname === '/super-admin/dashboard';

  if (isDashboard) {
    return null;
  }

  const handleBack = () => {
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      // Fallback depending on prefix path
      if (location.pathname.startsWith('/blood-bank-admin')) {
        navigate('/blood-bank-admin/dashboard');
      } else if (location.pathname.startsWith('/super-admin')) {
        navigate('/super-admin/dashboard');
      } else if (location.pathname.startsWith('/donor')) {
        navigate('/donor/dashboard');
      } else if (location.pathname.startsWith('/receiver')) {
        navigate('/receiver/dashboard');
      } else if (location.pathname.startsWith('/coordinator')) {
        navigate('/coordinator/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-brand-red transition cursor-pointer select-none mb-4 focus:outline-none"
    >
      ← Back
    </button>
  );
}
