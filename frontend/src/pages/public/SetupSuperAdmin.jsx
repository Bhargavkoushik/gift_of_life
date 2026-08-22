import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { useState, useEffect } from 'react';
import * as authService from '../../services/authService';

const setupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').max(50),
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

export default function SetupSuperAdmin() {
  const { setupAdmin } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkStatus = async () => {
    try {
      const data = await authService.getSetupSuperAdminStatus();
      if (data.isSetupClosed) {
        setIsClosed(true);
      }
    } catch (err) {
      console.error('Failed to fetch setup status:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(setupSchema),
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
    try {
      await setupAdmin(data.name, data.email, data.phone, data.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/super-admin/dashboard');
      }, 2000);
    } catch (err) {
      setServerError(err.message || 'Setup failed');
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="page-stack max-w-md mx-auto py-10 px-4">
        <PageHeader
          title="Setup Super Admin"
          description="Establish the root system administrator credentials."
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed">
            ⚠️ <strong>Access Denied:</strong> Super Admin has already been established. Setup is closed permanently.
          </div>
          <Link
            to="/login"
            className="inline-flex rounded-lg bg-brand-red px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-red-dark transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-md mx-auto py-10 px-4">
      <PageHeader
        title="Setup Super Admin"
        description="One-time system initialization to establish the official Trust Super Admin."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
            ✓ Super Admin setup completed successfully! Redirecting to dashboard...
          </div>
        )}

        {serverError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-200">
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xxs text-indigo-800 font-semibold leading-relaxed">
            ℹ️ <strong>Deployment notice:</strong> This form initiates the permanent, immutable Super Admin account. Choose a secure, official email.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Trust Administrator"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Official Email
            </label>
            <input
              type="email"
              placeholder="admin@gift-of-life.org"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
            )}

            {/* Password Rules checklist */}
            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xxs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={hasMinLength ? 'text-emerald-600' : 'text-slate-350'}>{hasMinLength ? '✓' : '○'}</span>
                <span className={hasMinLength ? 'text-slate-600 font-bold' : ''}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasUppercase ? 'text-emerald-600' : 'text-slate-350'}>{hasUppercase ? '✓' : '○'}</span>
                <span className={hasUppercase ? 'text-slate-600 font-bold' : ''}>At least one uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasLowercase ? 'text-emerald-600' : 'text-slate-350'}>{hasLowercase ? '✓' : '○'}</span>
                <span className={hasLowercase ? 'text-slate-600 font-bold' : ''}>At least one lowercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasNumber ? 'text-emerald-600' : 'text-slate-350'}>{hasNumber ? '✓' : '○'}</span>
                <span className={hasNumber ? 'text-slate-600 font-bold' : ''}>At least one number</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasSpecial ? 'text-emerald-600' : 'text-slate-350'}>{hasSpecial ? '✓' : '○'}</span>
                <span className={hasSpecial ? 'text-slate-600 font-bold' : ''}>At least one special character</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
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
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
            )}

            {showConfirmFeedback && (
              <p className={`mt-2 text-xxs font-bold uppercase tracking-wider ${isMatched ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isMatched ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full rounded-lg bg-brand-red py-3 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Configuring Super Admin...' : 'Establish Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
