import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import * as authService from '../../services/authService';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No invitation token provided. Please check the email link sent to you.');
      setLoading(false);
      return;
    }

    async function loadInvitation() {
      try {
        const data = await authService.validateInvitation(token);
        setInvitation(data.invitation);
        setPhone(data.invitation.phone || '');
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Invalid or expired invitation token. Please request a new invite.');
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Strong password policy
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.acceptInvitation({
        token,
        password,
        phone,
        employee_id: employeeId,
        notes,
        id_card_image: 'id_card_placeholder.png' // default string as we don't do file upload
      });
      setSuccessMsg(response.message || 'Verification submitted successfully! An administrator will review your staff identity and activate your account.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-lg mx-auto py-10 px-4">
      <PageHeader
        title="Setup Staff Account"
        description="Verify your invitation, set your account security credentials, and submit identity verification details."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-5 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none text-center space-y-4">
            <div>✓ {successMsg}</div>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition font-bold"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {invitation && !successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
              <div>
                <strong className="text-slate-800 uppercase tracking-wider block text-[10px] mb-0.5">Invited Role</strong>
                <span className="font-bold text-brand-red text-sm">{invitation.role}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <strong className="text-slate-800 text-[10px] uppercase block">Full Name</strong>
                  <span>{invitation.name}</span>
                </div>
                <div>
                  <strong className="text-slate-800 text-[10px] uppercase block">Email Address</strong>
                  <span>{invitation.email}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 9988776655"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Staff / Volunteer / Employee ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ASN-2026-08"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Identity & Organization Affiliation Notes
              </label>
              <textarea
                placeholder="Describe your role or division at ASN Raju Trust..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
            >
              {submitting ? 'Submitting details...' : 'Submit Verification & Register'}
            </button>
          </form>
        )}

        {!invitation && !loading && (
          <div className="text-center text-sm text-slate-500 pt-2">
            Back to{' '}
            <Link to="/login" className="font-semibold text-brand-red hover:text-brand-red-dark">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
