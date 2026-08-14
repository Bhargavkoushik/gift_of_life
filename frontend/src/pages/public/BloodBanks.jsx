import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBloodBanks } from '../../services/bloodBankService';

export default function BloodBanks() {
  const [filters, setFilters] = useState({
    name: '',
    state: '',
    district: '',
    area: '',
    service: 'All',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const fetchBloodBanks = async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};
      Object.keys(currentFilters).forEach((key) => {
        if (currentFilters[key] !== 'All' && currentFilters[key] !== '') {
          apiFilters[key] = currentFilters[key];
        }
      });

      const data = await getBloodBanks(apiFilters);
      setResults(data || []);
    } catch (err) {
      console.warn('Blood banks API connection pending:', err.message);
      setError('Connection to blood banks registry is pending initialization.');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    fetchBloodBanks(filters);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBloodBanks(filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      name: '',
      state: '',
      district: '',
      area: '',
      service: 'All',
    };
    setFilters(cleared);
    fetchBloodBanks(cleared);
  };

  return (
    <div className="page-stack">
      {/* 1. PAGE TITLE / INTRODUCTION */}
      <section className="text-center py-6 px-4 max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Blood Banks
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Find blood banks and related blood donation facilities near you.
        </p>
      </section>

      {/* 2. SEARCH & FILTER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filter 1: Search Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Search Blood Bank
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Search by name"
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

            {/* Filter 5: Services */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label htmlFor="service" className="text-xs font-semibold text-slate-700">
                Available Services
              </label>
              <select
                id="service"
                name="service"
                value={filters.service}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="All">All Services</option>
                <option value="Blood Collection">Blood Collection</option>
                <option value="Blood Storage">Blood Storage</option>
                <option value="Blood Distribution">Blood Distribution</option>
                <option value="Apheresis">Apheresis</option>
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
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-red-dark transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. VISUALLY DISTINCT SPOTLIGHT: ABOUT ASN RAJU BLOOD BANK */}
      <section className="rounded-2xl border-2 border-brand-red bg-white p-6 shadow-md flex flex-col md:flex-row gap-6 items-center">
        {/* Left: Image Placeholder */}
        <div className="w-full md:w-1/3 relative overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 h-[170px] flex items-center justify-center text-slate-400 shrink-0">
          <div className="text-center space-y-1">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider block">ASN Raju Image Placeholder</span>
          </div>
        </div>

        {/* Right: Intro */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-red-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-red">
              Primary Partner
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">ASN Raju Blood Bank</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            ASN Raju Blood Bank is our primary partner facility, supporting community blood donation camps, verified stock storage, and voluntary donor coordination.
          </p>
          <div className="text-xs text-slate-500">
            <strong className="text-slate-700">Contact & Address:</strong> Information will be updated once confirmed by the bank.
          </div>
          <div>
            <button
              type="button"
              onClick={() => alert("Detailed partner profile will be made available upon API completion.")}
              className="inline-flex items-center justify-center rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-red-dark transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* 4. RESULTS / CARDS GRID */}
      <section className="min-h-[250px] flex flex-col justify-center">
        {loading ? (
          /* Loading State */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-50 rounded w-full" />
                  <div className="h-4 bg-slate-50 rounded w-5/6" />
                </div>
                <div className="h-9 bg-slate-100 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          /* Card list if records are found (UI-ready for future integration) */
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              Registered Facilities ({results.length})
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((bank) => (
                <div key={bank.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900">{bank.name}</h3>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Location:</strong> {bank.area}, {bank.district}</div>
                      <div><strong>Services:</strong> {bank.services?.join(', ') || 'General Blood Services'}</div>
                      <div><strong>Contact:</strong> {bank.contact || 'Not available'}</div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => alert(`Details for ${bank.name} will be active when backend routes are verified.`)}
                      className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty / Connection Pending State */
          <div className="text-center py-12 px-4 space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-3.5 text-slate-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No blood banks found</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              {error ? error : 'Try adjusting your filters, searching for another location, or clearing active search parameters.'}
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

      {/* 5. ABOUT BLOOD BANKS */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-slate-950">About Blood Banks</h3>
        <p className="text-xs leading-relaxed text-slate-600">
          Blood banks and facilities play a vital role in ensuring safety, quality collection, components separation, and safe storage of blood resources. Registered locations listed on the Gift of Life directory support community-oriented donation campaigns and district general inventory availability.
        </p>
      </section>
    </div>
  );
}