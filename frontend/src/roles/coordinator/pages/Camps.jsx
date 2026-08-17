import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import {
  getCoordinatorCamps,
  createCoordinatorCamp,
  updateCoordinatorCamp,
  deleteCoordinatorCamp
} from '../../../services/bloodCampService';

export default function Camps() {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campToDelete, setCampToDelete] = useState(null);

  // Form Field States
  const [formFields, setFormFields] = useState({
    name: '',
    organizer: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    venue: '',
    address: '',
    area: '',
    district: '',
    state: '',
    contact_name: '',
    contact_phone: '',
    status: 'UPCOMING'
  });

  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoordinatorCamps();
      setCamps(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch camps registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleOpenAdd = () => {
    setSelectedCamp(null);
    setFormFields({
      name: '',
      organizer: '',
      description: '',
      date: '',
      start_time: '09:00:00',
      end_time: '17:00:00',
      venue: '',
      address: '',
      area: '',
      district: '',
      state: '',
      contact_name: '',
      contact_phone: '',
      status: 'UPCOMING'
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenEdit = (camp) => {
    setSelectedCamp(camp);
    // Format date string correctly to YYYY-MM-DD
    const campDate = camp.date ? new Date(camp.date).toISOString().split('T')[0] : '';
    setFormFields({
      name: camp.name || '',
      organizer: camp.organizer || '',
      description: camp.description || '',
      date: campDate,
      start_time: camp.start_time || '09:00:00',
      end_time: camp.end_time || '17:00:00',
      venue: camp.venue || '',
      address: camp.address || '',
      area: camp.area || '',
      district: camp.district || '',
      state: camp.state || '',
      contact_name: camp.contact_name || '',
      contact_phone: camp.contact_phone || '',
      status: camp.status || 'UPCOMING'
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (selectedCamp) {
        await updateCoordinatorCamp(selectedCamp.id, formFields);
      } else {
        await createCoordinatorCamp(formFields);
      }
      setShowEditModal(false);
      fetchCamps();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save camp details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDelete = (camp) => {
    setCampToDelete(camp);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!campToDelete) return;
    try {
      setFormLoading(true);
      await deleteCoordinatorCamp(campToDelete.id);
      setShowDeleteModal(false);
      fetchCamps();
    } catch (err) {
      setError(err.message || 'Failed to cancel camp.');
    } finally {
      setFormLoading(false);
      setCampToDelete(null);
    }
  };

  const filteredCamps = camps.filter((camp) => {
    const matchesName = camp.name.toLowerCase().includes(searchName.toLowerCase()) ||
                        camp.organizer.toLowerCase().includes(searchName.toLowerCase()) ||
                        camp.venue.toLowerCase().includes(searchName.toLowerCase());
    const matchesStatus = filterStatus === 'All' || camp.status === filterStatus;
    return matchesName && matchesStatus;
  });

  return (
    <div className="page-stack">
      <div className="flex justify-between items-center select-none">
        <PageHeader
          title="Blood Donation Camps Registry"
          description="View, register, and update voluntary blood donation camp locations and details."
        />
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 text-xs transition cursor-pointer shadow-sm select-none"
        >
          + Add New Camp
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none">
        <div className="flex-1">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Search Camps</label>
          <input
            type="text"
            placeholder="Search by camp name, organizer, or venue..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Filter status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="All">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ACTIVE">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading camps data...</div>
      ) : filteredCamps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
          <p className="text-slate-500 font-medium">No blood camps found matching search filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 select-none">
                  <th className="p-4">Camp Details</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Venue / Location</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCamps.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{camp.name}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">Org: {camp.organizer}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{new Date(camp.date).toLocaleDateString()}</div>
                      <div className="text-slate-450 text-[10px] mt-0.5">
                        {camp.start_time.slice(0, 5)} - {camp.end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{camp.venue}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{camp.area}, {camp.district}, {camp.state}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-750">{camp.contact_name}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{camp.contact_phone}</div>
                    </td>
                    <td className="p-4 font-bold uppercase text-[10px]">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full ${
                        camp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        camp.status === 'UPCOMING' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        camp.status === 'COMPLETED' ? 'bg-slate-50 text-slate-500 border border-slate-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1.5 transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {camp.status !== 'CANCELLED' && camp.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleOpenDelete(camp)}
                          className="rounded bg-rose-50 text-rose-650 hover:bg-rose-100 hover:text-rose-700 font-bold px-2.5 py-1.5 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT CAMP MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {selectedCamp ? 'Edit Donation Camp' : 'Create Donation Camp'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold text-lg select-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xxs font-semibold text-rose-800 border border-rose-100 select-none">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xxs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Camp Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formFields.name}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Organizer</label>
                  <input
                    type="text"
                    name="organizer"
                    required
                    value={formFields.organizer}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Description / Purpose</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formFields.description || ''}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formFields.date}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Start Time</label>
                    <input
                      type="text"
                      name="start_time"
                      placeholder="HH:MM:SS"
                      required
                      value={formFields.start_time}
                      onChange={handleInputChange}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">End Time</label>
                    <input
                      type="text"
                      name="end_time"
                      placeholder="HH:MM:SS"
                      required
                      value={formFields.end_time}
                      onChange={handleInputChange}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Venue Name</label>
                  <input
                    type="text"
                    name="venue"
                    required
                    placeholder="e.g. Community Center"
                    value={formFields.venue}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formFields.address}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Area / Locality</label>
                  <input
                    type="text"
                    name="area"
                    required
                    value={formFields.area}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">District</label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formFields.district}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">State</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formFields.state}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Camp Status</label>
                  <select
                    name="status"
                    value={formFields.status}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Contact Person Name</label>
                  <input
                    type="text"
                    name="contact_name"
                    required
                    value={formFields.contact_name}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Contact Phone Number</label>
                  <input
                    type="text"
                    name="contact_phone"
                    required
                    value={formFields.contact_phone}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={formLoading}
                  className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE/CANCEL MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-slate-900 select-none">
              Cancel Donation Camp
            </h3>
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              Are you sure you want to cancel and deactivate the camp <strong>"{campToDelete?.name}"</strong>? This will tag it as CANCELLED.
            </p>
            <div className="flex justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={formLoading}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={formLoading}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 cursor-pointer transition text-xxs disabled:opacity-50"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
