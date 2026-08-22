import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { useState, useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [showRegisteredMsg, setShowRegisteredMsg] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      setShowRegisteredMsg(true);
    }
  }, [location.state]);

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const loggedUser = await login(data.email, data.password);
      const userRoles = loggedUser.roles || [];

      // Determine redirect path
      const from = location.state?.from;
      const fromPathname = from?.pathname;
      const fromSearch = from?.search || '';

      if (fromPathname) {
        if (fromPathname === '/select-role') {
          if (fromSearch.includes('onboard=donor')) {
            if (userRoles.includes('DONOR')) {
              navigate('/donor/dashboard', { replace: true });
            } else {
              navigate('/select-role?onboard=donor', { replace: true });
            }
            return;
          }
          if (fromSearch.includes('onboard=receiver')) {
            if (userRoles.includes('RECEIVER')) {
              navigate('/receiver/dashboard', { replace: true });
            } else {
              navigate('/select-role?onboard=receiver', { replace: true });
            }
            return;
          }
        }

        // If there was a redirect from a protected page, check role match
        const isDonorRoute = fromPathname.startsWith('/donor');
        const isReceiverRoute = fromPathname.startsWith('/receiver');
        const isCoordinatorRoute = fromPathname.startsWith('/coordinator');
        const isAdminRoute = fromPathname.startsWith('/admin');
        const isBloodBankAdminRoute = fromPathname.startsWith('/blood-bank-admin');

        if (
          (isDonorRoute && userRoles.includes('DONOR')) ||
          (isReceiverRoute && userRoles.includes('RECEIVER')) ||
          (isCoordinatorRoute && userRoles.includes('COORDINATOR')) ||
          (isAdminRoute && userRoles.includes('ADMIN')) ||
          (isBloodBankAdminRoute && userRoles.includes('BLOOD_BANK_ADMIN'))
        ) {
          navigate(fromPathname + fromSearch, { replace: true });
          return;
        }
      }

      // Default redirect logic based on roles
      if (userRoles.length > 1) {
        if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
          navigate('/super-admin/dashboard', { replace: true });
        } else {
          navigate('/select-role', { replace: true });
        }
      } else if (userRoles.length === 1) {
        const role = userRoles[0];
        if (role === 'DONOR') navigate('/donor/dashboard', { replace: true });
        else if (role === 'RECEIVER') navigate('/receiver/dashboard', { replace: true });
        else if (role === 'COORDINATOR') navigate('/coordinator/dashboard', { replace: true });
        else if (role === 'ADMIN' || role === 'SUPER_ADMIN') navigate('/super-admin/dashboard', { replace: true });
        else if (role === 'BLOOD_BANK_ADMIN') navigate('/blood-bank-admin/dashboard', { replace: true });
      } else {
        // No profile activated yet
        navigate('/select-role', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="page-stack max-w-md mx-auto py-10 px-4">
      <PageHeader
        title="Sign In"
        description="Access your dashboard and donor/receiver workspaces."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {showRegisteredMsg && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200">
            Registration successful! Please sign in with your credentials.
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
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. john@example.com or phone"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <Link to="/forgot-password" id="forgot-password-link" className="text-xs font-semibold text-brand-red hover:text-brand-red-dark hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          New to Gift of Life?{' '}
          <Link to="/signup" className="font-semibold text-brand-red hover:text-brand-red-dark">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}