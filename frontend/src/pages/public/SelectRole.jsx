import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../components/PageHeader';
import MedicalBackground from '../../components/MedicalBackground';

const donorSchema = z.object({
  blood_group_id: z.coerce.number().int().positive('Please select a blood group'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: z.string().min(1, 'Please select gender'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  area: z.string().min(1, 'Area is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(4, 'Pincode must be at least 4 characters long'),
});

const receiverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().min(8, 'Phone must be at least 8 characters long'),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  area: z.string().min(1, 'Area is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(4, 'Pincode must be at least 4 characters long'),
  receiver_type: z.enum(['INDIVIDUAL', 'PATIENT_ATTENDANT', 'HOSPITAL']),
});

const bloodGroups = [
  { id: 1, code: 'A+' },
  { id: 2, code: 'A-' },
  { id: 3, code: 'B+' },
  { id: 4, code: 'B-' },
  { id: 5, code: 'AB+' },
  { id: 6, code: 'AB-' },
  { id: 7, code: 'O+' },
  { id: 8, code: 'O-' },
];

export default function SelectRole() {
  const { user, roles, switchWorkspace, promoteToDonor, promoteToReceiver, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeForm, setActiveForm] = useState(null); // 'donor' or 'receiver'
  const [errorMsg, setErrorMsg] = useState(null);

  const onboardParam = searchParams.get('onboard');

  useEffect(() => {
    if (onboardParam === 'donor' && roles && !roles.includes('DONOR')) {
      setActiveForm('donor');
    } else if (onboardParam === 'receiver' && roles && !roles.includes('RECEIVER')) {
      setActiveForm('receiver');
    }
  }, [onboardParam, roles]);

  const donorForm = useForm({
    resolver: zodResolver(donorSchema),
    defaultValues: { phone: user?.phone || '' }
  });

  const receiverForm = useForm({
    resolver: zodResolver(receiverSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      receiver_type: 'INDIVIDUAL'
    }
  });

  const handleSelectRole = (role) => {
    switchWorkspace(role);
    if (role === 'DONOR') navigate('/donor/dashboard');
    else if (role === 'RECEIVER') navigate('/receiver/dashboard');
    else if (role === 'COORDINATOR') navigate('/coordinator/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
  };

  const onDonorSubmit = async (data) => {
    setErrorMsg(null);
    try {
      await promoteToDonor(data);
      handleSelectRole('DONOR');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register as donor');
    }
  };

  const onReceiverSubmit = async (data) => {
    setErrorMsg(null);
    try {
      await promoteToReceiver(data);
      handleSelectRole('RECEIVER');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register as receiver');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden py-10 px-4">
      <MedicalBackground variant="simple" />
      <div className="relative z-10 page-stack max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <PageHeader
          title={`Welcome, ${user?.name || 'User'}`}
          description="Manage your account profile workspaces or register for role access."
        />
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Main role workspaces select list */}
      {!activeForm && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* DONOR CARD */}
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${roles.includes('DONOR') ? 'bg-brand-red-light/35 text-brand-red' : 'bg-slate-100 text-slate-500'}`}>
                {roles.includes('DONOR') ? 'Active Profile' : 'Not Activated'}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Blood Donor Workspace</h3>
              <p className="mt-2 text-sm text-slate-500">
                Update your donation availability, receive regional emergency blood requests, and track your donation history.
              </p>
            </div>
            <div className="mt-6">
              {roles.includes('DONOR') ? (
                <button
                  onClick={() => handleSelectRole('DONOR')}
                  className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark"
                >
                  Enter Donor Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setActiveForm('donor')}
                  className="w-full rounded-lg border border-brand-red py-2.5 text-sm font-semibold text-brand-red hover:bg-brand-red-light/35"
                >
                  Become a Donor
                </button>
              )}
            </div>
          </article>

          {/* RECEIVER CARD */}
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${roles.includes('RECEIVER') ? 'bg-brand-red-light/35 text-brand-red' : 'bg-slate-100 text-slate-500'}`}>
                {roles.includes('RECEIVER') ? 'Active Profile' : 'Not Activated'}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Blood Request Workspace</h3>
              <p className="mt-2 text-sm text-slate-500">
                Create emergency or standard blood requests, track matched donors in real-time, and manage fulfillment.
              </p>
            </div>
            <div className="mt-6">
              {roles.includes('RECEIVER') ? (
                <button
                  onClick={() => handleSelectRole('RECEIVER')}
                  className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark"
                >
                  Enter Receiver Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setActiveForm('receiver')}
                  className="w-full rounded-lg border border-brand-red py-2.5 text-sm font-semibold text-brand-red hover:bg-brand-red-light/35"
                >
                  Request Blood (Register Profile)
                </button>
              )}
            </div>
          </article>

          {/* PRIVILEGED ROLES SECTION */}
          {(roles.includes('COORDINATOR') || roles.includes('ADMIN')) && (
            <div className="md:col-span-2 mt-4 space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Privileged Dashboards</h4>
              <div className="grid md:grid-cols-2 gap-6">
                {roles.includes('COORDINATOR') && (
                  <article className="rounded-2xl border border-blue-200 bg-blue-50/20 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-blue-900">Blood Bank Coordinator</h3>
                      <p className="text-sm text-blue-700 mt-1">Review matches, call donors, and verify donations.</p>
                    </div>
                    <button
                      onClick={() => handleSelectRole('COORDINATOR')}
                      className="mt-4 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Enter Coordinator Area
                    </button>
                  </article>
                )}

                {roles.includes('ADMIN') && (
                  <article className="rounded-2xl border border-purple-200 bg-purple-50/20 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-purple-900">System Admin</h3>
                      <p className="text-sm text-purple-700 mt-1">Full access to logs, configurations, and inventory.</p>
                    </div>
                    <button
                      onClick={() => handleSelectRole('ADMIN')}
                      className="mt-4 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                      Enter Admin Console
                    </button>
                  </article>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. DONOR ONBOARDING FORM */}
      {activeForm === 'donor' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Donor Profile Registration</h3>
            <button
              onClick={() => setActiveForm(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={donorForm.handleSubmit(onDonorSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Blood Group
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('blood_group_id')}
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map(bg => (
                    <option key={bg.id} value={bg.id}>{bg.code}</option>
                  ))}
                </select>
                {donorForm.formState.errors.blood_group_id && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.blood_group_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('date_of_birth')}
                />
                {donorForm.formState.errors.date_of_birth && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.date_of_birth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Gender
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('gender')}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {donorForm.formState.errors.gender && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.gender.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Secondary Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder={user?.phone}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                {...donorForm.register('phone')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Physical Address
              </label>
              <textarea
                placeholder="Street address, building, floor..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                {...donorForm.register('address')}
              />
              {donorForm.formState.errors.address && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gachibowli"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('area')}
                />
                {donorForm.formState.errors.area && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.area.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('district')}
                />
                {donorForm.formState.errors.district && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telangana"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('state')}
                />
                {donorForm.formState.errors.state && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500032"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...donorForm.register('pincode')}
                />
                {donorForm.formState.errors.pincode && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{donorForm.formState.errors.pincode.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={donorForm.formState.isSubmitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark transition"
            >
              {donorForm.formState.isSubmitting ? 'Registering...' : 'Register as Blood Donor'}
            </button>
          </form>
        </div>
      )}

      {/* 5. RECEIVER ONBOARDING FORM */}
      {activeForm === 'receiver' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Receiver Profile Registration</h3>
            <button
              onClick={() => setActiveForm(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={receiverForm.handleSubmit(onReceiverSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Receiver Name (Full Legal Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('name')}
                />
                {receiverForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Receiver Type
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('receiver_type')}
                >
                  <option value="INDIVIDUAL">Individual / Patient</option>
                  <option value="PATIENT_ATTENDANT">Patient Attendant</option>
                  <option value="HOSPITAL">Hospital Representative</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                placeholder={user?.phone}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                {...receiverForm.register('phone')}
              />
              {receiverForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Physical Address
              </label>
              <textarea
                placeholder="Street address, building, floor..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                {...receiverForm.register('address')}
              />
              {receiverForm.formState.errors.address && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madhapur"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('area')}
                />
                {receiverForm.formState.errors.area && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.area.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('district')}
                />
                {receiverForm.formState.errors.district && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telangana"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('state')}
                />
                {receiverForm.formState.errors.state && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500081"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none"
                  {...receiverForm.register('pincode')}
                />
                {receiverForm.formState.errors.pincode && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{receiverForm.formState.errors.pincode.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={receiverForm.formState.isSubmitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark transition"
            >
              {receiverForm.formState.isSubmitting ? 'Registering...' : 'Register as Blood Receiver'}
            </button>
          </form>
        </div>
      )}

      {!activeForm && (
        <div className="mt-10 pt-8 border-t border-slate-200 max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage your account security and password.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/change-password')}
                className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark transition cursor-pointer text-center block"
              >
                Change Password →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
