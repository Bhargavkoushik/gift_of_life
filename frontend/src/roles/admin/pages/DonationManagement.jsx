import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BLOOD_GROUP_IDS = {
  'A+': 1, 'A-': 2, 'B+': 3, 'B-': 4, 'AB+': 5, 'AB-': 6, 'O+': 7, 'O-': 8
};

export default function DonationManagement() {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [metrics, setMetrics] = useState({ totalDonations: 0, donationsToday: 0, donationsThisMonth: 0, totalUnits: 0 });
  const [coordinators, setCoordinators] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal details
  const [selectedDonation, setSelectedDonation] = useState(null);

  const loadInitialData = async () => {
    try {
      const coordRes = await adminService.getActiveCoordinators();
      setCoordinators(coordRes.coordinators || []);
    } catch (err) {
      console.error('Error loading coordinators:', err);
    }
  };

  const loadDonationData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const statsRes = await adminService.getAdminDonationStats();
      setMetrics(statsRes.stats || { totalDonations: 0, donationsToday: 0, donationsThisMonth: 0, totalUnits: 0 });

      const donationsRes = await adminService.getAdminDonations({
        search: search || undefined,
        bloodGroupId: selectedBloodGroup ? BLOOD_GROUP_IDS[selectedBloodGroup] : undefined,
        coordinatorId: selectedCoordinator || undefined
      });
      setDonations(donationsRes.donations || []);
    } catch (err) {
      console.error('Error loading donations:', err);
      setErrorMsg(`Failed to load donations. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDonationData();
  }, [selectedBloodGroup, selectedCoordinator]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDonationData();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBloodGroup('');
    setSelectedCoordinator('');
    setShowFilters(false);
    // Trigger reload
    setTimeout(() => {
      loadDonationData();
    }, 50);
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page-stack max-w-6xl relative select-none">
      <PageHeader
        title="Donations"
        description="Monitor completed blood donations and their associated requests."
      />

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm flex flex-wrap justify-between items-center gap-6 max-w-5xl">
        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Donations</span>
          <strong className="text-xl font-extrabold text-slate-800">{metrics.totalDonations || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Donations Today</span>
          <strong className="text-xl font-extrabold text-emerald-600">{metrics.donationsToday || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Donations This Month</span>
          <strong className="text-xl font-extrabold text-purple-600">{metrics.donationsThisMonth || 0}</strong>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Units</span>
          <strong className="text-xl font-extrabold text-brand-red">{metrics.totalUnits || 0}</strong>
        </div>
      </div>

      {/* CONTROL TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-5xl justify-between relative">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <input
            type="search"
            placeholder="Search by donor, patient, hospital, or coordinator..."
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
                selectedBloodGroup || selectedCoordinator
                  ? 'border-brand-red bg-rose-50 text-brand-red'
                  : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
              </svg>
              <span>Filters</span>
              {(selectedBloodGroup || selectedCoordinator) && (
                <span className="h-2 w-2 rounded-full bg-brand-red" />
              )}
            </button>

            {/* FILTER POPOVER PANEL */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl z-35 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xxs font-black uppercase tracking-wider text-slate-400">Filter Donations</h4>
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
                      value={selectedBloodGroup}
                      onChange={(e) => setSelectedBloodGroup(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
                    >
                      <option value="">All Groups</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Coordinator</label>
                    <select
                      value={selectedCoordinator}
                      onChange={(e) => setSelectedCoordinator(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
                    >
                      <option value="">All Coordinators</option>
                      {coordinators.map((c) => (
                        <option key={c.user_id} value={c.user_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA LAYOUT */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-5xl">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7Z" />
          </svg>
          <h3 className="mt-4 text-xs font-bold text-slate-700 uppercase tracking-wider">No completed donations found.</h3>
          <p className="mt-1 text-xxs text-slate-450 font-semibold">Try modifying your search or filter values.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-455 font-sans">
                  <th className="px-5 py-3.5">Donor</th>
                  <th className="px-4 py-3.5">Blood Group</th>
                  <th className="px-4 py-3.5">Units</th>
                  <th className="px-4 py-3.5">Donation Date</th>
                  <th className="px-4 py-3.5">Patient / Request</th>
                  <th className="px-4 py-3.5">Hospital</th>
                  <th className="px-4 py-3.5">Coordinator</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xxs font-semibold text-slate-700">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-800">{donation.donor_name}</div>
                      <div className="text-[10px] text-slate-455 font-mono mt-0.5">{donation.donor_phone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-rose-150 bg-rose-50 px-2.5 py-0.5 font-sans font-black text-[9px] text-brand-red shadow-xxs">
                        {donation.blood_group}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-extrabold">{donation.units}</td>
                    <td className="px-4 py-4 font-mono text-slate-500">{formatTimestamp(donation.donation_date)}</td>
                    <td className="px-4 py-4">
                      {donation.patient_name ? (
                        <div>
                          <span className="font-bold block">{donation.patient_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Req ID: {donation.request_id?.slice(0, 8)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-450 italic">Voluntary</span>
                      )}
                    </td>
                    <td className="px-4 py-4 max-w-[150px] truncate">{donation.hospital_name || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-600 font-bold">{donation.coordinator_name || 'N/A'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedDonation(donation)}
                        className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xxs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST */}
          <div className="grid gap-3 md:hidden">
            {donations.map((donation) => (
              <article key={donation.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">{donation.donor_name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{donation.donor_phone}</span>
                  </div>
                  <span className="rounded-full border border-rose-150 bg-rose-50 px-2.5 py-0.5 font-sans font-black text-[9px] text-brand-red shadow-xxs">
                    {donation.blood_group}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 border-t border-b border-slate-100 py-3 text-[10px] font-semibold text-slate-600">
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Units</span>
                    <strong className="text-slate-800 text-xs">{donation.units}</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Donation Date</span>
                    <span className="font-mono text-slate-800">{formatTimestamp(donation.donation_date)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Hospital</span>
                    <span className="text-slate-800">{donation.hospital_name || 'N/A'}</span>
                  </div>
                  {donation.patient_name && (
                    <div className="col-span-2">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Patient / Request</span>
                      <span className="text-slate-800 font-bold">{donation.patient_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <div className="text-[10px] text-slate-500">
                    Coordinator: <strong className="text-slate-700">{donation.coordinator_name || 'N/A'}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedDonation(donation)}
                    className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xxs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* READ-ONLY DETAILS MODAL */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Donation Record Details
              </h3>
              <button
                onClick={() => setSelectedDonation(null)}
                className="text-slate-400 hover:text-slate-600 transition text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Info Body */}
            <div className="space-y-4.5 overflow-y-auto max-h-[400px] pr-1">
              
              {/* Section 1: Donation Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Donation Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xxs font-semibold text-slate-650">
                  <div>
                    <span className="block text-[9px] text-slate-400">Donation ID</span>
                    <span className="font-mono text-slate-800">{selectedDonation.id}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">Status</span>
                    <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 font-bold text-[9px] text-emerald-700">
                      {selectedDonation.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">Donation Date</span>
                    <span className="font-mono text-slate-800">{formatTimestamp(selectedDonation.donation_date)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">Units Donated</span>
                    <strong className="text-slate-800 text-xs">{selectedDonation.units} Units</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Donor Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Donor Details</h4>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-xxs font-semibold text-slate-650">
                  <div><span className="text-slate-455">Full Name:</span> <strong className="text-slate-800">{selectedDonation.donor_name}</strong></div>
                  <div><span className="text-slate-455">Email Address:</span> <span className="font-mono text-slate-800">{selectedDonation.donor_email}</span></div>
                  <div><span className="text-slate-455">Phone Number:</span> <span className="font-mono text-slate-800">{selectedDonation.donor_phone}</span></div>
                  <div><span className="text-slate-455">Blood Group:</span> <span className="inline-flex rounded-full border border-rose-150 bg-rose-50 px-2 py-0.2 font-sans font-black text-[9px] text-brand-red ml-1 shadow-xxs">{selectedDonation.blood_group}</span></div>
                </div>
              </div>

              {/* Section 3: Request/Patient Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Associated Request</h4>
                {selectedDonation.patient_name ? (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-xxs font-semibold text-slate-650">
                    <div><span className="text-slate-455">Patient Name:</span> <strong className="text-slate-800">{selectedDonation.patient_name}</strong></div>
                    <div><span className="text-slate-455">Hospital:</span> <span className="text-slate-800">{selectedDonation.hospital_name}</span></div>
                    <div><span className="text-slate-455">Request ID:</span> <span className="font-mono text-slate-800">{selectedDonation.request_id}</span></div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-xxs py-2 px-1">This was a voluntary donation not linked to any specific patient request.</div>
                )}
              </div>

              {/* Section 4: Coordinator Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Verifying Coordinator</h4>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xxs font-semibold text-slate-650">
                  <div><span className="text-slate-455">Coordinator:</span> <strong className="text-slate-800">{selectedDonation.coordinator_name || 'System Auto-Generated'}</strong></div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDonation(null)}
                className="rounded-lg bg-slate-50 px-4 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}