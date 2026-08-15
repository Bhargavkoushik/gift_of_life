import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';

export default function ReceiverProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
      setPhone(data.phone || '');
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await receiverService.updateReceiverProfile({
        name,
        phone,
        address,
        area,
        district,
        state,
        pincode,
        receiver_type: receiverType
      });
      setProfile(updated);
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
    <div className="page-stack max-w-2xl">
      <PageHeader
        title="My Profile"
        description="View your verification status and configure profile details used in coordination."
      />

      <div className="space-y-4">
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
                <span className="text-[10px] text-slate-450 font-bold uppercase block mt-1">{receiverType.replace('_', ' ')}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xxs font-semibold">
                <span className="text-slate-400 block uppercase font-bold text-[8px] mb-1">Verification Status</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 border ${
                  profile?.verification_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  profile?.verification_status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {profile?.verification_status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* EDIT FORM */}
          <div className="md:col-span-2">
            <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={updating}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={updating}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Receiver Type</label>
                  <select
                    value={receiverType}
                    onChange={(e) => setReceiverType(e.target.value)}
                    disabled={updating}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-700"
                  >
                    <option value="INDIVIDUAL">Individual Patient</option>
                    <option value="PATIENT_ATTENDANT">Patient Attendant</option>
                    <option value="HOSPITAL">Hospital Representative</option>
                  </select>
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

              <button
                type="submit"
                disabled={updating}
                className="w-full rounded-lg bg-brand-red py-3 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
              >
                {updating ? 'Updating Profile...' : 'Update Profile Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
