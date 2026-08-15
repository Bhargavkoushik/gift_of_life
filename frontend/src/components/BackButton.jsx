import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    try {
      const historyStr = sessionStorage.getItem('donorHistory');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        const currentIndex = history.lastIndexOf(location.pathname);
        if (currentIndex > 0 && history[currentIndex - 1]?.startsWith('/donor')) {
          setHasPrev(true);
        } else {
          setHasPrev(false);
        }
      } else {
        setHasPrev(false);
      }
    } catch (e) {
      setHasPrev(false);
    }
  }, [location.pathname]);

  if (location.pathname === '/donor/dashboard') {
    return null;
  }

  const handleBack = () => {
    if (hasPrev) {
      navigate(-1);
    } else {
      navigate('/donor/dashboard');
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-brand-red transition cursor-pointer select-none mb-4 focus:outline-none"
    >
      ← {hasPrev ? 'Back' : 'Back to Dashboard'}
    </button>
  );
}
