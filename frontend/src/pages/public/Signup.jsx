import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { useState } from 'react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

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
    <div className="page-stack max-w-md mx-auto py-10">
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
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
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
            <input
              type="password"
              placeholder="Min 6 characters"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {isSubmitting ? 'Signing up...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
