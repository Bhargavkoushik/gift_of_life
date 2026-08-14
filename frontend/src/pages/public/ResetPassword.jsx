import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../components/PageHeader';
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
  const token = searchParams.get('token') || '';
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

  // Password rules validation states
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passwordValue);

  // Confirm password matching evaluation states
  const showConfirmFeedback = confirmPasswordValue.length > 0;
  const isMatched = showConfirmFeedback && (passwordValue === confirmPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccess(false);

    if (!token) {
      setServerError('Reset token is missing or invalid. Please check your recovery link.');
      return;
    }

    try {
      await authService.resetPassword(token, data.password, data.confirmPassword);
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

              {/* Password complexity visual list */}
              <div className="mt-2.5 space-y-1 text-[11px] select-none pl-1">
                <div className="text-slate-500 font-semibold mb-1">Password must contain:</div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  <span>{hasMinLength ? '✓' : '✗'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  <span>{hasUppercase ? '✓' : '✗'}</span>
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  <span>{hasLowercase ? '✓' : '✗'}</span>
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  <span>{hasNumber ? '✓' : '✗'}</span>
                  <span>One number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                  <span>{hasSpecial ? '✓' : '✗'}</span>
                  <span>One special character</span>
                </div>
              </div>

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
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
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
