import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../components/PageHeader';
import PasswordRequirementsRuleList, { evalPasswordRules } from '../../components/PasswordRequirementsRuleList';
import * as authService from '../../services/authService';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((val) => /[A-Z]/.test(val), 'Must contain at least one uppercase letter')
    .refine((val) => /[a-z]/.test(val), 'Must contain at least one lowercase letter')
    .refine((val) => /[0-9]/.test(val), 'Must contain at least one number')
    .refine((val) => /[^a-zA-Z0-9]/.test(val), 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const [tokenInput, setTokenInput] = useState(urlToken);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Password rules validation states via shared rule evaluator
  const { isValid: isPasswordValid } = evalPasswordRules(passwordValue);

  // Confirm password matching evaluation states
  const showConfirmFeedback = confirmPasswordValue.length > 0;
  const isMatched = showConfirmFeedback && (passwordValue === confirmPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccess(false);

    const finalToken = tokenInput.trim();
    if (!finalToken) {
      setServerError('Reset token is missing. Please enter or paste the recovery token from your email or SMS.');
      return;
    }

    try {
      await authService.resetPassword(finalToken, data.password, data.confirmPassword);
      setSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Reset failed';
      setServerError(errMsg);
    }
  };

  return (
    <div className="page-stack max-w-md mx-auto py-10 px-4">
      <PageHeader
        title="Reset Password"
        description="Define your new account credentials below."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {success && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
              ✓ Password reset successfully. You can now sign in using your new credentials.
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-red-dark transition"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
                ⚠️ {serverError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Reset Token / Recovery Code
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter or paste recovery token"
                className="w-full rounded-lg border border-slate-200 p-2.5 font-mono text-sm focus:border-brand-red focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {urlToken
                  ? 'Token auto-populated from link. You may also paste an SMS token.'
                  : 'Enter the token received via SMS or email.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 text-sm focus:border-brand-red focus:outline-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Shared password complexity visual list */}
              <PasswordRequirementsRuleList password={passwordValue} title="Password must contain:" />

              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 text-sm focus:border-brand-red focus:outline-none"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {showConfirmFeedback && (
                <p className={`mt-1 text-xs font-semibold ${isMatched ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  {isMatched ? 'Passwords match ✓' : 'Passwords do not match'}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !tokenInput.trim() || !isPasswordValid || !isMatched}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-red hover:text-brand-red-dark">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
