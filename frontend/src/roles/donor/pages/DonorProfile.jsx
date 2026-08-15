import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    blood_group_id: 1,
    date_of_birth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    area: '',
    district: '',
    state: '',
    pincode: '',
    primary_phone: '',
    email: ''
  });
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await donorService.getDonorProfile();
        if (data) {
          // Format date of birth to YYYY-MM-DD for date picker input
          const dobFormatted = data.date_of_birth ? data.date_of_birth.substring(0, 10) : '';
          setProfile({
            ...data,
            date_of_birth: dobFormatted
          });
        }
      } catch (err) {
        setErrorMsg('Failed to load profile details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Client Validations
    if (!profile.name.trim()) {
      setErrorMsg('Full Name is required.');
      setSaving(false);
      return;
    }
    if (!profile.address.trim()) {
      setErrorMsg('Address is required.');
      setSaving(false);
      return;
    }
    if (!profile.area.trim()) {
      setErrorMsg('Area/Neighborhood is required.');
      setSaving(false);
      return;
    }
    if (!profile.district.trim()) {
      setErrorMsg('District is required.');
      setSaving(false);
      return;
    }
    if (!profile.state.trim()) {
      setErrorMsg('State is required.');
      setSaving(false);
      return;
    }
    if (!profile.pincode.trim() || profile.pincode.length < 4) {
      setErrorMsg('Please enter a valid pincode.');
      setSaving(false);
      return;
    }

    try {
      const updated = await donorService.updateDonorProfile({
        name: profile.name,
        blood_group_id: Number(profile.blood_group_id),
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        phone: profile.phone || null,
        address: profile.address,
        area: profile.area,
        district: profile.district,
        state: profile.state,
        pincode: profile.pincode
      });
      if (updated) {
        const dobFormatted = updated.date_of_birth ? updated.date_of_birth.substring(0, 10) : '';
        setProfile((prev) => ({
          ...prev,
          ...updated,
          date_of_birth: dobFormatted
        }));
        setSuccessMsg('Your donor profile has been updated successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save changes. Please check input formats.';
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

  return (
    <div className="page-stack max-w-2xl">
      <PageHeader
        title="Donor Profile"
        description="Verify and update your blood donor details below to ensure accurate matching."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={profile.name}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email Address (ReadOnly)
              </label>
              <input
                type="email"
                readOnly
                value={profile.email}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Blood Group
              </label>
              <select
                name="blood_group_id"
                value={profile.blood_group_id}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg.id} value={bg.id}>
                    {bg.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                required
                value={profile.date_of_birth}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Primary Phone (ReadOnly)
              </label>
              <input
                type="text"
                readOnly
                value={profile.primary_phone}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Secondary Phone (Optional)
              </label>
              <input
                type="text"
                name="phone"
                value={profile.phone || ''}
                onChange={handleChange}
                disabled={saving}
                placeholder="Alternative contact number"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                required
                value={profile.pincode}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Full Address
            </label>
            <textarea
              name="address"
              required
              rows="3"
              value={profile.address}
              onChange={handleChange}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800 resize-none"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Area / Neighborhood
              </label>
              <input
                type="text"
                name="area"
                required
                value={profile.area}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                District
              </label>
              <input
                type="text"
                name="district"
                required
                value={profile.district}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                required
                value={profile.state}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand-red focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer"
            >
              {saving ? 'Saving changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}