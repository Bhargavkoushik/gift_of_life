import { useState, useEffect } from 'react';
import { getBloodAvailability } from '../../services/bloodAvailabilityService';

// Human-readable helpers for component types
const COMPONENT_LABELS = {
  'WHOLE_BLOOD': 'Whole Blood',
  'RED_CELLS': 'Packed Red Cells',
  'PLATELETS': 'Platelets',
  'PLASMA': 'Plasma',
};

export default function BloodAvailability() {
  const [filters, setFilters] = useState({
    bloodGroup: 'All',
    state: '',
    district: '',
    area: '',
    status: 'All',
    component: 'All',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const fetchAvailability = async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Map 'All' values to empty strings or filter parameters expected by API
      const apiFilters = {};
      Object.keys(currentFilters).forEach((key) => {
        if (currentFilters[key] !== 'All' && currentFilters[key] !== '') {
          apiFilters[key] = currentFilters[key];
        }
      });

      const data = await getBloodAvailability(apiFilters);
      setResults(data || []);
    } catch (err) {
      console.warn('API connection pending or failed:', err.message);
      // Log failure but handle gracefully without breaking UI
      setError('Live database connection is pending initialization.');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    fetchAvailability(filters);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAvailability(filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      bloodGroup: 'All',
      state: '',
      district: '',
      area: '',
      status: 'All',
      component: 'All',
    };
    setFilters(cleared);
    fetchAvailability(cleared);
  };

  return (
    <div className="page-stack">
      {/* 1. PAGE HERO / TITLE */}
      <section className="text-center py-6 px-4 max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Blood Availability
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Check available blood groups and find relevant blood availability near you.
        </p>
      </section>

      {/* 2. SEARCH & FILTER BAR */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filter 1: Blood Group */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bloodGroup" className="text-xs font-semibold text-slate-700">
                Blood Group
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={filters.bloodGroup}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="All">All Blood Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
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

            {/* Filter 5: Availability Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-xs font-semibold text-slate-700">
                Availability Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Low">Low</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            {/* Filter 6: Blood Component */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="component" className="text-xs font-semibold text-slate-700">
                Blood Component
              </label>
              <select
                id="component"
                name="component"
                value={filters.component}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none transition"
              >
                <option value="All">All Components</option>
                <option value="WHOLE_BLOOD">Whole Blood</option>
                <option value="RED_CELLS">Packed Red Cells</option>
                <option value="PLASMA">Plasma</option>
                <option value="PLATELETS">Platelets</option>
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
              {loading ? 'Searching...' : 'Search Availability'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. BLOOD GROUP SUMMARY CARDS */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red text-center">
          Group Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
            <div key={group} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="text-xl font-black text-slate-900">{group}</div>
              <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Data Pending
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AVAILABILITY RESULTS & EMPTY STATE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[250px] flex flex-col justify-center">
        {loading ? (
          /* Loading / Skeleton State */
          <div className="space-y-4 py-6">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
            <div className="space-y-2">
              <div className="h-10 bg-slate-50 rounded-lg w-full animate-pulse" />
              <div className="h-10 bg-slate-50 rounded-lg w-full animate-pulse" />
              <div className="h-10 bg-slate-50 rounded-lg w-full animate-pulse" />
            </div>
          </div>
        ) : results.length > 0 ? (
          /* Detailed Results (Desktop: Table, Mobile: Cards) */
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Matching Inventory Records</h3>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Component</th>
                    <th className="px-4 py-3">Available Units</th>
                    <th className="px-4 py-3">Blood Bank / Location</th>
                    <th className="px-4 py-3">Expiration Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{row.blood_group_name || 'Unknown'}</td>
                      <td className="px-4 py-3.5 text-slate-700">{COMPONENT_LABELS[row.component] || row.component}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{row.units} Units</td>
                      <td className="px-4 py-3.5 text-slate-600">{row.blood_bank_location}</td>
                      <td className="px-4 py-3.5 text-slate-500">{new Date(row.expiration_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {new Date(row.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden space-y-3">
              {results.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-black text-slate-900">{row.blood_group_name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      row.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><strong>Component:</strong> {COMPONENT_LABELS[row.component] || row.component}</div>
                    <div><strong>Units:</strong> {row.units}</div>
                    <div className="col-span-2"><strong>Location:</strong> {row.blood_bank_location}</div>
                    <div className="col-span-2 text-slate-400 mt-1">
                      Expires: {new Date(row.expiration_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty / Connection Pending State */
          <div className="text-center py-10 px-4 space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-3.5 text-slate-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No blood availability found</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              {error ? error : 'Try adjusting your filters, searching in another district or area, or clearing active search parameters.'}
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

      {/* 5. INFORMATION SECTION */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-slate-950">About Blood Availability</h3>
        <p className="text-xs leading-relaxed text-slate-600">
          The blood stock numbers listed here represent the latest verified records provided by partner blood banks and inventory loggers. The availability status is updated regularly to ensure accuracy. If you have an urgent clinical emergency, please submit a direct request or consult with local hospital coordinators immediately.
        </p>
      </section>
    </div>
  );
}