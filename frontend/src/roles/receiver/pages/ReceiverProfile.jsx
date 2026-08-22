import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';
import { useAuth } from '../../../context/AuthContext';

export default function ReceiverProfile() {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [receiverType, setReceiverType] = useState('INDIVIDUAL');

  const loadProfile = async () => {
    try {
      const data = await receiverService.getReceiverProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setSecondaryPhone(data.secondary_phone || '');
      setAddress(data.address || '');
      setArea(data.area || '');
      setDistrict(data.district || '');
      setState(data.state || '');
      setPincode(data.pincode || '');
      setReceiverType(data.receiver_type || 'INDIVIDUAL');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (profile) {
      // Revert to database values
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setSecondaryPhone(profile.secondary_phone || '');
      setAddress(profile.address || '');
      setArea(profile.area || '');
      setDistrict(profile.district || '');
      setState(profile.state || '');
      setPincode(profile.pincode || '');
      setReceiverType(profile.receiver_type || 'INDIVIDUAL');
    }
    setIsEditMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Frontend phone validation for secondary_phone if filled
    if (secondaryPhone && secondaryPhone.trim().length < 8) {
      setErrorMsg('Secondary phone number must be at least 8 characters long.');
      setUpdating(false);
      return;
    }

    try {
      await receiverService.updateReceiverProfile({
        address,
        area,
        district,
        state,
        pincode,
        receiver_type: receiverType,
        secondary_phone: secondaryPhone ? secondaryPhone.trim() : null
      });
      
      // Reload profile from backend to get fresh fields
      await loadProfile();
      setIsEditMode(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile settings.');
    } finally {
      setUpdating(false);
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
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Profile"
        description="View your verification status and configure profile details used in coordination."
      />

      <div className="space-y-6">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-850 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* PROFILE SUMMARY */}
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center space-y-4">
              <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-extrabold text-xl font-sans mx-auto">
                {name ? name.charAt(0).toUpperCase() : 'R'}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight">{name || 'Receiver Profile'}</h3>
              </div>
              
              <div className="pt-3 border-t border-slate-100 text-xxs font-semibold">
                <span className="text-slate-400 block uppercase font-bold text-[8px] mb-1">Account Status</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 border text-[9px] font-bold ${
                  currentUser?.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {currentUser?.is_verified ? '✓ Account Verified' : '✕ Account Not Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW / EDIT CONTAINER */}
          <div className="md:col-span-2">
            {!isEditMode ? (
              /* VIEW MODE */
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Profile Details</h3>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xxs font-bold transition cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* VIEW GRID */}
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
                    <div className="grid gap-3 sm:grid-cols-2 text-xxs font-semibold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Full Name</span>
                        <span className="text-slate-800">{name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Email Address</span>
                        <span className="text-slate-800">{email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Primary Phone</span>
                        <span className="text-slate-800">{phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Secondary Phone</span>
                        <span className="text-slate-800">{secondaryPhone || 'Not added'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Details</h4>
                    <div className="grid gap-3 sm:grid-cols-2 text-xxs font-semibold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="col-span-2">
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Street Address</span>
                        <span className="text-slate-800 leading-normal">{address}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Area / Locality</span>
                        <span className="text-slate-800">{area}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Pincode</span>
                        <span className="text-slate-800">{pincode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">District</span>
                        <span className="text-slate-800">{district}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">State</span>
                        <span className="text-slate-800">{state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Edit Profile</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={updating}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xxs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-lg bg-brand-red text-white hover:bg-brand-red-dark px-3 py-1.5 text-xxs font-bold transition cursor-pointer"
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Read-only Identity Fields */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5 select-none">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Protected Account Credentials</h4>
                    <div className="grid gap-3 sm:grid-cols-2 text-xxs font-semibold">
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Full Name</span>
                        <span className="text-slate-600">{name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Email Address</span>
                        <span className="text-slate-600">{email}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Primary Phone</span>
                        <span className="text-slate-600">{phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Editable Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Secondary Phone (Optional)</label>
                      <input
                        type="tel"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        disabled={updating}
                        placeholder="e.g. 9876543211"
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        disabled={updating}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Area / Locality</label>
                      <input
                        type="text"
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        disabled={updating}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={updating}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={updating}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Street Address</label>
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={updating}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 rounded-lg bg-brand-red py-3 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer text-center"
                  >
                    {updating ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={updating}
                    className="flex-1 rounded-lg bg-slate-150 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
