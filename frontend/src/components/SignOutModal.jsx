import { useState, useEffect, useRef } from 'react';

export default function SignOutModal({ isOpen, onClose, onConfirm, loggingOut, error }) {
  const [confirmText, setConfirmText] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim() === 'SIGNOUT';

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isConfirmed && !loggingOut) {
        onConfirm();
      } else {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-4 font-sans">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
              <svg className="h-6 w-6 stroke-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h3 id="signout-modal-title" className="text-base font-black text-slate-900 leading-tight">
                Confirm Sign Out
              </h3>
              <p className="text-xs font-semibold text-slate-500">Security confirmation required</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Please type <span className="font-mono font-bold text-rose-600 px-1 py-0.5 bg-rose-50 rounded">SIGNOUT</span> below to end your active workspace session.
          </p>

          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-100">
              ⚠️ {error}
            </div>
          )}

          <div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={loggingOut}
              placeholder="Type SIGNOUT"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-mono font-bold text-slate-800 tracking-wider focus:border-brand-red focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loggingOut}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!isConfirmed || loggingOut}
              className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
