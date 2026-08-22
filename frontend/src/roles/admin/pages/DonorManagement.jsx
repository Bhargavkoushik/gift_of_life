import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function DonorManagement() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ metrics: {}, donors: [] });
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('recently_registered');

  // Filter Popover Visibility
  const [showFilters, setShowFilters] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const loadDonors = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.getDonors({
        search: search || undefined,
        bloodGroup: bloodGroup || undefined,
        availability: availability || undefined,
        sort
      });
      setData(res);
    } catch (err) {
      console.error('Error loading donors:', err);
      setErrorMsg(`Failed to load donors directory list. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, [bloodGroup, availability, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDonors();
  };

  const clearFilters = () => {
    setSearch('');
    setBloodGroup('');
    setAvailability('');
    setSort('recently_registered');
    setShowFilters(false);
  };

  const getFriendlyStatus = (status) => {
    const mapping = {
      'AVAILABLE': 'Ready to Donate',
      'NOT_AVAILABLE': 'Not Available',
      'PENDING': 'Pending Verification',
      'TEMPORARILY_DEFERRED': 'Temporarily Deferred',
      'NOT_ELIGIBLE': 'Not Eligible'
    };
    return mapping[status] || status;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'NOT_AVAILABLE':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      case 'TEMPORARILY_DEFERRED':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-150';
    }
  };

  const { metrics, donors } = data;

  return (
    <div className="page-stack max-w-6xl relative select-none">
      <PageHeader
        title="Donors"
        description="Monitor registered donors and their donation activity."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* LIGHTWEIGHT METRICS STRIP */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm flex flex-wrap justify-between items-center gap-6 max-w-5xl">
        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Registered Donors</span>
          <strong className="text-xl font-extrabold text-slate-800">{metrics.registered || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />
        
        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Active Accounts</span>
          <strong className="text-xl font-extrabold text-slate-800">{metrics.active || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Ready to Donate</span>
          <strong className="text-xl font-extrabold text-emerald-600">{metrics.ready || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Donations</span>
          <strong className="text-xl font-extrabold text-brand-red">{metrics.donations || 0}</strong>
        </div>
      </div>

      {/* COMPACT CONTROL ROW */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-5xl justify-between relative">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <input
            type="search"
            placeholder="Search donors by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-red focus:outline-none bg-white font-semibold text-slate-700"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-red hover:bg-brand-red-dark px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer font-sans"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2.5 items-center justify-end relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg border px-4 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                bloodGroup || availability
                  ? 'border-brand-red bg-rose-50 text-brand-red'
                  : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
              </svg>
              <span>Filters</span>
              {(bloodGroup || availability) && (
                <span className="h-2 w-2 rounded-full bg-brand-red" />
              )}
            </button>

            {/* FILTER POPOVER PANEL */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl z-30 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xxs font-black uppercase tracking-wider text-slate-400">Filter Directory</h4>
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-705"
                    >
                      <option value="">All Blood Groups</option>
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Availability</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-705"
                    >
                      <option value="">All Availability</option>
                      <option value="AVAILABLE">Ready to Donate</option>
                      <option value="NOT_AVAILABLE">Not Available</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full rounded-lg bg-slate-900 py-2 text-xxs font-bold text-white hover:bg-black transition cursor-pointer uppercase tracking-wider"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold focus:outline-none text-slate-650 cursor-pointer"
          >
            <option value="recently_registered">Recently Registered</option>
            <option value="recently_donated">Recently Donated</option>
            <option value="most_donations">Most Donations</option>
          </select>
        </div>
      </div>

      {/* DIRECTORY LISTING */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
        </div>
      ) : donors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm max-w-5xl">
          <p className="text-slate-500 font-semibold text-xs">No donors found matching criteria.</p>
        </div>
      ) : (
        <div className="max-w-5xl">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-450 select-none">
                  <th className="px-6 py-3.5">Donor</th>
                  <th className="px-6 py-3.5 text-center">Blood Group</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Donations</th>
                  <th className="px-6 py-3.5">Last Donation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xxs font-semibold text-slate-650 leading-relaxed">
                {donors.map(donor => (
                  <tr
                    key={donor.id}
                    onClick={() => navigate(`/super-admin/donors/${donor.id}`)}
                    className="hover:bg-slate-50/70 transition duration-100 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs leading-normal">{donor.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">{donor.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs font-black text-brand-red">
                      {donor.blood_group}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 border uppercase font-bold text-[9px] ${getStatusBadgeStyle(donor.availability_status)}`}>
                        {getFriendlyStatus(donor.availability_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-800">
                      {donor.donations_count}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {donor.last_donation_date
                        ? new Date(donor.last_donation_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'No donations logged'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS VIEW */}
          <div className="grid gap-3.5 md:hidden">
            {donors.map(donor => (
              <div
                key={donor.id}
                onClick={() => navigate(`/super-admin/donors/${donor.id}`)}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm space-y-3.5 cursor-pointer hover:border-slate-300 transition duration-150"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{donor.name}</h3>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{donor.email}</span>
                  </div>
                  <span className="h-9 w-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red font-black text-xs font-mono">
                    {donor.blood_group}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span className={`inline-flex rounded-full px-2 py-0.5 border uppercase font-bold text-[8px] ${getStatusBadgeStyle(donor.availability_status)}`}>
                    {getFriendlyStatus(donor.availability_status)}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">
                    {donor.donations_count} donations · Last: {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}