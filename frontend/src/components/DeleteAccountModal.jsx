import { useState, useEffect, useRef } from 'react';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, deleting, error }) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setPassword('');
      setConfirmText('');
      setShowPassword(false);
      setLocalError(null);
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

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim() === 'DELETE' && reason.trim().length >= 5 && password.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    if (reason.trim().length < 5) {
      setLocalError('Please provide a reason of at least 5 characters.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your current password for security verification.');
      return;
    }
    if (confirmText.trim() !== 'DELETE') {
      setLocalError('Please type DELETE to confirm.');
      return;
    }

    onConfirm({
      reason: reason.trim(),
      password,
      confirmText: 'DELETE'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden"
      >
        <div className="p-6 sm:p-7 space-y-4 font-sans">
          <div className="flex items-center gap-3 text-rose-700">
            <div className="p-3 rounded-xl bg-rose-100/80 border border-rose-200 shrink-0">
              <svg className="h-6 w-6 stroke-rose-700" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 id="delete-modal-title" className="text-base font-black text-slate-900 leading-tight">
                Deactivate & Delete Account
              </h3>
              <p className="text-xs font-semibold text-rose-600">Permanent security action</p>
            </div>
          </div>

          <div className="rounded-xl bg-rose-50/70 p-4 text-xs font-semibold text-rose-900 border border-rose-200/70 leading-relaxed space-y-1.5">
            <p className="font-bold">⚠️ Important Information Regarding Account Deletion:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] font-normal">
              <li>Your account will be immediately deactivated and logged out.</li>
              <li>You will no longer be able to log in or access your dashboard.</li>
              <li>Prior clinical donation records and completed blood requests are preserved for regulatory compliance and health-audit integrity.</li>
              <li>Account deletion cannot be performed if you have ongoing active requests or pending donation commitments.</li>
            </ul>
          </div>

          {(error || localError) && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-100">
              ⚠️ {error || localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Account Deletion <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={deleting}
                placeholder="Please tell us why you wish to delete your account (minimum 5 characters)..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-none resize-none font-sans"
              />
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Verify Current Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={deleting}
                  placeholder="Enter your current password"
                  className="w-full rounded-lg border border-slate-200 p-2.5 pr-12 text-xs focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Type DELETE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to Confirm <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={deleting}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-mono font-bold text-slate-800 tracking-wider focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConfirmed || deleting}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {deleting ? 'Deactivating...' : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
