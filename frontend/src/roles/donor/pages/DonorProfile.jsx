import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';
import { useAuth } from '../../../context/AuthContext';

const bloodGroups = [
  { id: 1, code: 'A+' },
  { id: 2, code: 'A-' },
  { id: 3, code: 'B+' },
  { id: 4, code: 'B-' },
  { id: 5, code: 'AB+' },
  { id: 6, code: 'AB-' },
  { id: 7, code: 'O+' },
  { id: 8, code: 'O-' }
];

export default function DonorProfile() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroupId, setBloodGroupId] = useState(1);
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadProfile = async () => {
    try {
      const data = await donorService.getDonorProfile();
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setBloodGroupId(Number(data.blood_group_id) || 1);
        setGender(data.gender || 'MALE');
        const dobFormatted = data.date_of_birth ? data.date_of_birth.substring(0, 10) : '';
        setDateOfBirth(dobFormatted);
        setPrimaryPhone(data.primary_phone || '');
        setSecondaryPhone(data.phone || '');
        setPincode(data.pincode || '');
        setAddress(data.address || '');
        setArea(data.area || '');
        setDistrict(data.district || '');
        setState(data.state || '');
      }
    } catch (err) {
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setBloodGroupId(Number(profile.blood_group_id) || 1);
      setGender(profile.gender || 'MALE');
      const dobFormatted = profile.date_of_birth ? profile.date_of_birth.substring(0, 10) : '';
      setDateOfBirth(dobFormatted);
      setPrimaryPhone(profile.primary_phone || '');
      setSecondaryPhone(profile.phone || '');
      setPincode(profile.pincode || '');
      setAddress(profile.address || '');
      setArea(profile.area || '');
      setDistrict(profile.district || '');
      setState(profile.state || '');
    }
    setIsEditMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Validations
    if (!address.trim()) {
      setErrorMsg('Address is required.');
      setSaving(false);
      return;
    }
    if (!area.trim()) {
      setErrorMsg('Area/Neighborhood is required.');
      setSaving(false);
      return;
    }
    if (!district.trim()) {
      setErrorMsg('District is required.');
      setSaving(false);
      return;
    }
    if (!state.trim()) {
      setErrorMsg('State is required.');
      setSaving(false);
      return;
    }
    if (!pincode.trim() || pincode.length < 4) {
      setErrorMsg('Please enter a valid pincode.');
      setSaving(false);
      return;
    }

    try {
      const updated = await donorService.updateDonorProfile({
        name,
        blood_group_id: Number(bloodGroupId),
        date_of_birth: dateOfBirth,
        gender,
        phone: secondaryPhone ? secondaryPhone.trim() : null,
        address,
        area,
        district,
        state,
        pincode
      });
      if (updated) {
        await loadProfile();
        setIsEditMode(false);
        setSuccessMsg('Your profile has been updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile changes.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const currentBloodGroup = bloodGroups.find(g => g.id === bloodGroupId)?.code || 'N/A';

  return (
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Donor Profile"
        description="Verify and configure your blood donor details used in compatibility matching."
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
              <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-brand-red font-extrabold text-xl font-sans mx-auto">
                {name ? name.charAt(0).toUpperCase() : 'D'}
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight">{name}</h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">Blood Donor</span>
              </div>

              {/* ACCOUNT VERIFICATION (Show only verified vs not verified badge, no pending) */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[8px] mb-2">Account Verification</span>
                {currentUser?.is_verified ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                    ● Account Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-150">
                    ● Account Not Verified
                  </span>
                )}
              </div>
              
              <div className="pt-3 border-t border-slate-100 text-xxs font-semibold">
                <span className="text-slate-400 block uppercase font-bold text-[8px] mb-1">Blood Group</span>
                <span className="inline-flex rounded-full px-2.5 py-0.5 border text-[10px] font-bold bg-rose-50 text-brand-red border-rose-100">
                  {currentBloodGroup}
                </span>
                <p className="text-[8px] text-slate-400 leading-relaxed mt-2.5">
                  Matches compatible requests in the blood bank.
                </p>
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
                        <span className="text-slate-800">{primaryPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Secondary Phone</span>
                        <span className="text-slate-800">{secondaryPhone || 'Not added'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Medical Information</h4>
                    <div className="grid gap-3 sm:grid-cols-2 text-xxs font-semibold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Blood Group</span>
                        <span className="text-slate-850 text-brand-red font-bold">{currentBloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Gender</span>
                        <span className="text-slate-850 uppercase">{gender}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Date of Birth</span>
                        <span className="text-slate-800">{dateOfBirth || 'Not provided'}</span>
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
              <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Edit Profile</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xxs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-brand-red text-white hover:bg-brand-red-dark px-3 py-1.5 text-xxs font-bold transition cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Read-only protected Identity Fields */}
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
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Primary Phone</span>
                        <span className="text-slate-600">{primaryPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[8px] mb-0.5">Blood Group</span>
                        <span className="text-slate-650 text-brand-red font-bold">{currentBloodGroup}</span>
                      </div>
                    </div>
                  </div>

                  {/* Editable Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-700"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={saving}
                        required
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Secondary Phone (Optional)</label>
                      <input
                        type="tel"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        disabled={saving}
                        placeholder="Alternative contact number"
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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none resize-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-brand-red py-3 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer text-center font-sans"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-slate-150 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer text-center font-sans"
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