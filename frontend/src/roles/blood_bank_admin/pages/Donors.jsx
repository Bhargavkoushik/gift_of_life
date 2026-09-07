import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const loadDonors = async () => {
    try {
      const data = await bloodBankAdminService.getDonors();
      setDonors(data);
      setFilteredDonors(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load donors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, []);

  useEffect(() => {
    let result = donors;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        d.phone.includes(term) ||
        (d.area && d.area.toLowerCase().includes(term))
      );
    }

    if (selectedGroup) {
      result = result.filter(d => d.blood_group === selectedGroup);
    }

    if (selectedAvailability) {
      result = result.filter(d => d.availability_status === selectedAvailability);
    }

    setFilteredDonors(result);
  }, [search, selectedGroup, selectedAvailability, donors]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="Eligible Donors"
        description="Monitor registered donors, blood groups, matching eligibility, and geographic distribution."
      />

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100">
          ⚠️ {error}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search name, email, phone, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-brand-red font-semibold"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-white font-bold text-slate-600 cursor-pointer"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-white font-bold text-slate-600 cursor-pointer"
          >
            <option value="">All Availabilities</option>
            <option value="AVAILABLE">Available</option>
            <option value="NOT_AVAILABLE">Not Available</option>
          </select>
        </div>
      </div>

      {/* DONOR TABLE LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredDonors.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">
            No matching donors found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Blood Group</th>
                  <th className="p-4">Donor Name</th>
                  <th className="p-4">Geographic Area</th>
                  <th className="p-4">Donation Status</th>
                  <th className="p-4">Last Donated</th>
                  <th className="p-4 pr-6">Contact Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                {filteredDonors.map((donor) => (
                  <tr key={donor.donor_profile_id} className="hover:bg-slate-50/50 transition duration-75">
                    <td className="p-4 pl-6">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-black text-xs">
                        {donor.blood_group}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{donor.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{donor.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{donor.area || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{donor.district || 'Bhimavaram'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${donor.availability_status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                          donor.availability_status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {donor.availability_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-mono">
                        {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Completed: {donor.donations_count}</div>
                    </td>
                    <td className="p-4 pr-6 font-mono text-slate-800">
                      {donor.phone || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
