import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import {
  getCoordinatorInventory,
  createCoordinatorInventory,
  updateCoordinatorInventory,
  deleteCoordinatorInventory,
  getBloodGroups
} from '../../../services/bloodAvailabilityService';

const COMPONENT_LABELS = {
  'WHOLE_BLOOD': 'Whole Blood',
  'RED_CELLS': 'Packed Red Cells',
  'PLATELETS': 'Platelets',
  'PLASMA': 'Plasma',
};

export default function BloodAvailability() {
  const [inventory, setInventory] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [filterBloodGroup, setFilterBloodGroup] = useState('All');
  const [filterComponent, setFilterComponent] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form Field States
  const [formFields, setFormFields] = useState({
    blood_group_id: '',
    component: 'WHOLE_BLOOD',
    blood_bank_location: '',
    units: 0,
    collection_date: '',
    expiration_date: '',
    status: 'AVAILABLE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, groupsData] = await Promise.all([
        getCoordinatorInventory(),
        getBloodGroups()
      ]);
      setInventory(invData || []);
      setBloodGroups(groupsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormFields({
      blood_group_id: bloodGroups[0]?.id || '',
      component: 'WHOLE_BLOOD',
      blood_bank_location: '',
      units: 1,
      collection_date: new Date().toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
      status: 'AVAILABLE'
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    const colDate = item.collection_date ? new Date(item.collection_date).toISOString().split('T')[0] : '';
    const expDate = item.expiration_date ? new Date(item.expiration_date).toISOString().split('T')[0] : '';
    setFormFields({
      blood_group_id: item.blood_group_id,
      component: item.component,
      blood_bank_location: item.blood_bank_location,
      units: item.units,
      collection_date: colDate,
      expiration_date: expDate,
      status: item.status
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: name === 'blood_group_id' || name === 'units' ? parseInt(value, 10) : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (selectedItem) {
        await updateCoordinatorInventory(selectedItem.id, formFields);
      } else {
        await createCoordinatorInventory(formFields);
      }
      setShowEditModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save inventory levels.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setFormLoading(true);
      await deleteCoordinatorInventory(itemToDelete.id);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete inventory record.');
    } finally {
      setFormLoading(false);
      setItemToDelete(null);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesBloodGroup = filterBloodGroup === 'All' || item.blood_group_name === filterBloodGroup;
    const matchesComponent = filterComponent === 'All' || item.component === filterComponent;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesBloodGroup && matchesComponent && matchesStatus;
  });

  return (
    <div className="page-stack">
      <div className="flex justify-between items-center select-none">
        <PageHeader
          title="Blood Inventory Stock Management"
          description="Log collected blood units, update stock counts, and verify expiration dates."
        />
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 text-xs transition cursor-pointer shadow-sm select-none"
        >
          + Add Blood Stock
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none">
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Filter by Group</label>
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="All">All Blood Groups</option>
            {bloodGroups.map((g) => (
              <option key={g.id} value={g.code}>{g.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Filter by Component</label>
          <select
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="All">All Components</option>
            <option value="WHOLE_BLOOD">Whole Blood</option>
            <option value="RED_CELLS">Packed Red Cells</option>
            <option value="PLATELETS">Platelets</option>
            <option value="PLASMA">Plasma</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="All">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="EXPIRED">Expired</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
      </div>

      {/* Main Stock Table */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading inventory data...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm select-none">
          <p className="text-slate-500 font-medium">No blood inventory logs matching search filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 select-none">
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Component Type</th>
                  <th className="p-4">Stock Units</th>
                  <th className="p-4">Bank Location</th>
                  <th className="p-4">Date Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-black text-slate-900 text-sm">
                      {item.blood_group_name}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {COMPONENT_LABELS[item.component] || item.component}
                    </td>
                    <td className="p-4 font-bold text-blue-600 text-sm">
                      {item.units} Units
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {item.blood_bank_location}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">Expires: {new Date(item.expiration_date).toLocaleDateString()}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">Collected: {new Date(item.collection_date).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-bold uppercase text-[10px]">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full ${
                        item.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        item.status === 'RESERVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        item.status === 'EXPIRED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1.5 transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDelete(item)}
                        className="rounded bg-rose-50 text-rose-650 hover:bg-rose-100 hover:text-rose-700 font-bold px-2.5 py-1.5 transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT STOCK MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {selectedItem ? 'Edit Blood Stock Level' : 'Add Blood Stock Record'}
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
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Blood Group</label>
                <select
                  name="blood_group_id"
                  required
                  value={formFields.blood_group_id}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  {bloodGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.code} ({g.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Blood Component</label>
                <select
                  name="component"
                  required
                  value={formFields.component}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="RED_CELLS">Packed Red Cells</option>
                  <option value="PLATELETS">Platelets</option>
                  <option value="PLASMA">Plasma</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Units Count</label>
                <input
                  type="number"
                  name="units"
                  required
                  min="0"
                  value={formFields.units}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Blood Bank Location</label>
                <input
                  type="text"
                  name="blood_bank_location"
                  required
                  placeholder="e.g. Metro Blood Bank, Block B"
                  value={formFields.blood_bank_location}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Collection Date</label>
                  <input
                    type="date"
                    name="collection_date"
                    required
                    value={formFields.collection_date}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Expiration Date</label>
                  <input
                    type="date"
                    name="expiration_date"
                    required
                    value={formFields.expiration_date}
                    onChange={handleInputChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Inventory Status</label>
                <select
                  name="status"
                  value={formFields.status}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 select-none">
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
                  {formLoading ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-slate-900 select-none">
              Delete Stock Record
            </h3>
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              Are you sure you want to permanently delete this blood inventory record of <strong>{itemToDelete?.units} Units</strong> of <strong>{itemToDelete?.blood_group_name} ({COMPONENT_LABELS[itemToDelete?.component]})</strong>?
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
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
