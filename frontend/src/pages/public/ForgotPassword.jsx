import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import * as authService from '../../services/authService';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your email or phone number.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;

    if (!emailRegex.test(trimmed) && !phoneRegex.test(trimmed)) {
      setErrorMsg("Please enter a valid email address or phone number.");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(trimmed);
      setSuccessMsg(response.message || 'If an account exists with this information, recovery instructions have been sent.');
    } catch (err) {
      if (err.message === 'Network Error' || !err.response) {
        setErrorMsg("Unable to connect to the recovery service. Please check your connection and try again.");
      } else {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 404) {
          setErrorMsg("Password recovery service is currently unavailable. Please try again later.");
        } else if (status === 429) {
          setErrorMsg("Too many recovery requests. Please wait a few minutes and try again.");
        } else if (status === 400) {
          setErrorMsg(data?.message || "Please enter a valid email address or phone number.");
        } else if (status >= 500) {
          setErrorMsg("Unable to process your recovery request right now. Please try again later.");
        } else {
          setErrorMsg("Something went wrong while processing your request. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack max-w-md mx-auto py-10 px-4">
      <PageHeader
        title="Recover Password"
        description="Verify your account email or phone number to receive recovery instructions."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email or phone number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. john@example.com or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
            >
              {loading ? 'Sending...' : 'Send Recovery Instructions'}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-slate-500 pt-2">
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-red hover:text-brand-red-dark">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
