import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBloodCamps } from '../../services/bloodCampService';

// Human-readable status mapping
const STATUS_LABELS = {
  'UPCOMING': 'Upcoming',
  'ACTIVE': 'Ongoing',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled',
};

export default function BloodCamps() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const [filters, setFilters] = useState({
    name: '',
    state: '',
    district: '',
    area: '',
    dateFilter: 'Upcoming', // 'Upcoming' or 'All'
    status: 'All',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const fetchBloodCamps = async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};
      Object.keys(currentFilters).forEach((key) => {
        if (currentFilters[key] !== 'All' && currentFilters[key] !== '') {
          apiFilters[key] = currentFilters[key];
        }
      });

      const data = await getBloodCamps(apiFilters);
      setResults(data || []);
    } catch (err) {
      console.warn('Camps API connection pending:', err.message);
      setError('Connection to blood camps registry is pending initialization.');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    fetchBloodCamps(filters);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBloodCamps(filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      name: '',
      state: '',
      district: '',
      area: '',
      dateFilter: 'Upcoming',
      status: 'All',
    };
    setFilters(cleared);
    fetchBloodCamps(cleared);
  };

  // Follows the same dynamic onboarding/redirect behavior as the home page
  const handleBecomeDonorCTA = () => {
    if (!user) {
      navigate('/select-role');
    } else if (roles && roles.includes('DONOR')) {
      navigate('/donor/dashboard');
    } else {
      navigate('/select-role');
    }
  };

  return (
    <div className="page-stack">
      {/* 1. PAGE TITLE / INTRODUCTION */}
      <section className="text-center py-6 px-4 max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Blood Donation Camps
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Find upcoming blood donation camps and discover opportunities to donate blood near you.
        </p>
      </section>

      {/* 2. SEARCH & FILTER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filter 1: Camp Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Search Camp
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Search by camp name"
                value={filters.name}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Filter 2: State */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="text-xs font-semibold text-slate-700">
                State
              </label>
              <input
                id="state"
                type="text"
                name="state"
                placeholder="Enter State"
                value={filters.state}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Filter 3: District */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="district" className="text-xs font-semibold text-slate-700">
                District
              </label>
              <input
                id="district"
                type="text"
                name="district"
                placeholder="Enter District"
                value={filters.district}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Filter 4: Area */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="area" className="text-xs font-semibold text-slate-700">
                Area / City
              </label>
              <input
                id="area"
                type="text"
                name="area"
                placeholder="Enter Area"
                value={filters.area}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Filter 5: Date filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dateFilter" className="text-xs font-semibold text-slate-700">
                Date filter
              </label>
              <select
                id="dateFilter"
                name="dateFilter"
                value={filters.dateFilter}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="Upcoming">Upcoming Camps</option>
                <option value="All">All Dates</option>
              </select>
            </div>

            {/* Filter 6: Camp Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-xs font-semibold text-slate-700">
                Camp Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="All">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-red-dark transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Camps'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. UPCOMING CAMPS & CARDS */}
      <section className="min-h-[250px] flex flex-col justify-center">
        {loading ? (
          /* Loading State */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-[60px] w-[60px] bg-slate-100 rounded-xl" />
                  <div className="h-5 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-50 rounded w-full" />
                  <div className="h-4 bg-slate-50 rounded w-4/5" />
                </div>
                <div className="h-9 bg-slate-100 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          /* Detailed Camp Cards */
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              Upcoming Blood Camps ({results.length})
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((camp) => {
                const campDate = new Date(camp.date);
                const day = campDate.getDate() || '??';
                const month = campDate.toLocaleString('default', { month: 'short' }).toUpperCase() || 'MMM';
                
                return (
                  <div key={camp.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
                    <div className="space-y-3.5">
                      {/* Date block + Title */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center bg-brand-red-light rounded-xl p-2 w-[55px] h-[55px] text-center border border-brand-red/10 shrink-0 select-none">
                          <span className="text-[10px] font-black uppercase text-brand-red leading-none">{month}</span>
                          <span className="text-lg font-black text-brand-red mt-0.5 leading-none">{day}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{camp.name}</h3>
                      </div>

                      {/* Location & Time Info */}
                      <div className="text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span>📍</span>
                          <span>{camp.venue}, {camp.area}, {camp.district}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>🕐</span>
                          <span>{camp.start_time?.slice(0, 5)} - {camp.end_time?.slice(0, 5)}</span>
                        </div>
                        <div className="pt-1">
                          <strong>Organizer:</strong> {camp.organizer}
                        </div>
                        <div>
                          <strong>Contact:</strong> {camp.contact_phone || 'Not available'}
                        </div>
                      </div>
                    </div>

                    {/* Status & View Details button */}
                    <div className="flex justify-between items-center pt-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        camp.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : camp.status === 'UPCOMING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                      }`}>
                        {STATUS_LABELS[camp.status] || camp.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`Details for "${camp.name}" will be active once database APIs are fully integrated.`)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty / Connection Pending State */
          <div className="text-center py-12 px-4 space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-3.5 text-slate-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No upcoming blood camps found</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              {error ? error : 'Camp information will appear here once the camp registry is connected. Try clearing your filters.'}
            </p>
            <div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. HOW BLOOD CAMPS WORK */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-950 text-center">How Blood Donation Camps Work</h3>
        <div className="grid gap-6 sm:grid-cols-4 relative">
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-900 pt-1">Find a Camp</h4>
            <p className="text-xs text-slate-500 px-2 leading-relaxed">
              Use filters to lookup upcoming camps in your area.
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-900 pt-1">Check Details</h4>
            <p className="text-xs text-slate-500 px-2 leading-relaxed">
              Verify the date, location venue, timings, and eligibility instructions.
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-900 pt-1">Visit & Register</h4>
            <p className="text-xs text-slate-500 px-2 leading-relaxed">
              Go to the camp venue during the active hours and check-in with coordinators.
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red font-black border border-red-100 text-sm">
              4
            </div>
            <h4 className="text-sm font-bold text-slate-900 pt-1">Donate Blood</h4>
            <p className="text-xs text-slate-500 px-2 leading-relaxed">
              Complete the quick donation checkup and help save lives.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 shadow-sm text-white grid gap-6 md:grid-cols-3 items-center">
        <div className="md:col-span-2 space-y-3">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-200">
            Get Involved
          </span>
          <h2 className="text-2xl font-bold">Ready to Help Save Lives?</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Become a donor and participate in future blood donation camps. Every single donation has the potential to save up to three lives.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={handleBecomeDonorCTA}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-red shadow-md hover:bg-slate-100 transition"
          >
            Become a Donor
          </button>
        </div>
      </section>
    </div>
  );
}