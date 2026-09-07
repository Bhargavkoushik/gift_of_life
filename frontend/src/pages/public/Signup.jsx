import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { useState } from 'react';
import PasswordRequirementsRuleList, { evalPasswordRules } from '../../components/PasswordRequirementsRuleList';

const signupSchema = z.object({
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

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Password rules validation states from shared helper
  const { isValid: isPasswordValid } = evalPasswordRules(passwordValue);

  // Confirm password matching evaluation states
  const showConfirmFeedback = confirmPasswordValue.length > 0;
  const isMatched = showConfirmFeedback && (passwordValue === confirmPasswordValue);


  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await signup(data.name, data.email, data.phone, data.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { registered: true } });
      }, 2000);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="page-stack max-w-md mx-auto py-10 px-4">
      <PageHeader
        title="Create Account"
        description="Sign up for the Gift of Life blood donor and receiver network."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200">
            Account created successfully! Redirecting to login...
          </div>
        )}

        {serverError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="john@example.com"
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

            {/* Password requirements visual validation list */}
            <PasswordRequirementsRuleList password={passwordValue} />

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
            disabled={isSubmitting || success || !isPasswordValid || !isMatched}
            className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer animate-none"
          >
            {isSubmitting ? 'Signing up...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-red hover:text-brand-red-dark">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
