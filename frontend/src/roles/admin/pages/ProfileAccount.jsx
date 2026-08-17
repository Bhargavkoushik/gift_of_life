import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../../components/PageHeader';
import * as authService from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

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

export default function ProfileAccount() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form States
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
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

  // Confirm password matching states
  const showConfirmFeedback = confirmPasswordValue.length > 0;
  const isMatched = showConfirmFeedback && (newPasswordValue === confirmPasswordValue);

  const fetchProfile = async () => {
    setLoading(true);
    setProfileError(null);
    try {
      const user = await authService.getCurrentUser();
      setProfile(user);
      setName(user.name || '');
      setPhone(user.phone || '');
    } catch (err) {
      setProfileError('Unable to load your profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setUpdatingProfile(true);

    if (!name.trim()) {
      setProfileError('Name is required.');
      setUpdatingProfile(false);
      return;
    }

    if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      setProfileError('Please provide a valid phone number.');
      setUpdatingProfile(false);
      return;
    }

    try {
      await authService.updateProfile(name, phone);
      setProfileSuccess('Profile updated successfully.');
      // Refresh local profile state
      setProfile(prev => ({ ...prev, name, phone }));
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update profile details.';
      setProfileError(errMsg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data) => {
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      );
      
      setPasswordSuccess('Password changed successfully. Please sign in again.');
      reset();
      
      // Auto logout after 3 seconds to force re-authentication
      setTimeout(() => {
        logout(true);
      }, 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to change password';
      setPasswordError(errMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="page-stack">
        <PageHeader title="Profile / Account" description="Manage your administrator account and security settings." />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-2xl select-none">
          ⚠️ {profileError}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Profile / Account"
        description="Manage your administrator account and security settings."
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 max-w-5xl">
        {/* Left Side: Profile Details form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4 select-none">
              My Profile
            </h3>

            {profileError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xxs font-semibold text-rose-850 border border-rose-100 mb-4 select-none leading-relaxed">
                ⚠️ {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xxs font-semibold text-emerald-850 border border-emerald-100 mb-4 select-none leading-relaxed">
                ✓ {profileSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-semibold text-slate-700 text-xxs">
              {/* Full Name */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                  required
                />
              </div>

              {/* Official Email (Read-Only) */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Official Email (Read-Only)</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 select-none cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-400 font-bold block pt-0.5">Verified official login email credential.</span>
              </div>

              {/* Phone (Unverified marker) */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                />
                <span className="text-[9px] text-slate-400 font-bold block pt-0.5">⚠️ Unverified phone contact number.</span>
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={updatingProfile}
                className="rounded-lg bg-brand-red hover:bg-brand-red-dark text-white font-bold px-4 py-2.5 text-xs transition cursor-pointer select-none disabled:bg-slate-350"
              >
                {updatingProfile ? 'Saving Changes...' : 'Save Profile details'}
              </button>
            </form>
          </div>

          {/* Security Section (Change Password) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4 select-none">
              Security & Credentials
            </h3>

            {passwordError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xxs font-semibold text-rose-850 border border-rose-100 mb-4 select-none leading-relaxed">
                ⚠️ {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xxs font-semibold text-emerald-850 border border-emerald-100 mb-4 select-none leading-relaxed">
                ✓ {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4 font-semibold text-slate-700 text-xxs">
              {/* Current Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Current Password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                    {...register('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-700 focus:outline-none select-none cursor-pointer"
                  >
                    {showCurrent ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-rose-600 font-bold text-[10px]">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="New Password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-700 focus:outline-none select-none cursor-pointer"
                  >
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Complexity visual indicators list */}
                <div className="space-y-1 text-[10px] select-none pl-1 mt-1">
                  <div className="text-slate-400 font-bold mb-1">New password must contain:</div>
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
                  <p className="text-rose-600 font-bold text-[10px] mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-red transition"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-700 focus:outline-none select-none cursor-pointer"
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showConfirmFeedback && (
                  <p className={`text-[10px] font-bold mt-1 ${isMatched ? 'text-green-600' : 'text-red-500'}`}>
                    {isMatched ? 'Passwords match ✓' : 'Passwords do not match'}
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-rose-600 font-bold text-[10px]">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-brand-red hover:bg-brand-red-dark text-white font-bold px-4 py-2.5 text-xs transition cursor-pointer select-none disabled:bg-slate-350"
              >
                {isSubmitting ? 'Updating Credentials...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Read-Only Account information card */}
        <div className="space-y-6 col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm font-semibold text-slate-700 text-xxs leading-relaxed">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4 select-none">
              Account Information
            </h3>

            <div className="space-y-4">
              {/* Role */}
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Assigned Role</span>
                <span className="rounded bg-rose-50 text-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {profile?.roles?.join(', ') || 'ADMIN'}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Account Status</span>
                <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider select-none">
                  {profile?.status || 'Active'}
                </span>
              </div>

              {/* Created */}
              <div className="flex justify-between items-start py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Created</span>
                <span className="text-slate-800 font-bold text-right font-mono">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              {/* Last Login */}
              <div className="flex justify-between items-start py-1">
                <span className="text-slate-400 font-bold">Last Login</span>
                <span className="text-slate-800 font-bold text-right font-mono">
                  {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
