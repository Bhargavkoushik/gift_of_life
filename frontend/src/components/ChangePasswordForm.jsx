import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authService from '../services/authService';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .refine((val) => /[A-Z]/.test(val), 'Must contain at least one uppercase letter')
    .refine((val) => /[a-z]/.test(val), 'Must contain at least one lowercase letter')
    .refine((val) => /[0-9]/.test(val), 'Must contain at least one number')
    .refine((val) => /[^a-zA-Z0-9]/.test(val), 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ChangePasswordForm() {
  const [successMsg, setSuccessMsg] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = watch('newPassword') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Password rules validation states
  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasLowercase = /[a-z]/.test(newPasswordValue);
  const hasNumber = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPasswordValue);

  // Confirm password matching evaluation states
  const showConfirmFeedback = confirmPasswordValue.length > 0;
  const isMatched = showConfirmFeedback && (newPasswordValue === confirmPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccessMsg(null);

    try {
      const response = await authService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      );
      setSuccessMsg(response.message || 'Password changed successfully.');
      reset(); // Clear form values
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to change password';
      setServerError(errMsg);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
          ✓ {successMsg}
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="Current Password"
              className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 text-sm focus:border-brand-red focus:outline-none"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
            >
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="New Password"
              className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 text-sm focus:border-brand-red focus:outline-none"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Password complexity visual list */}
          <div className="mt-2.5 space-y-1 text-[11px] select-none pl-1">
            <div className="text-slate-500 font-semibold mb-1">New password must contain:</div>
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

          {errors.newPassword && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your new password"
              className="w-full rounded-lg border border-slate-200 p-2.5 pr-10 text-sm focus:border-brand-red focus:outline-none"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none select-none"
            >
              {showConfirm ? 'Hide' : 'Show'}
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
          className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
        >
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
