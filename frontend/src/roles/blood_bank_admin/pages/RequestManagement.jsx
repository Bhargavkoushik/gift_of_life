import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function RequestManagement() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const loadRequests = async () => {
    try {
      const data = await bloodBankAdminService.getRequests();
      setRequests(data);
      setFilteredRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let result = requests;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(r =>
        r.patient_name.toLowerCase().includes(term) ||
        r.hospital_name.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term)
      );
    }

    if (selectedGroup) {
      result = result.filter(r => r.blood_group === selectedGroup);
    }

    if (selectedStatus) {
      result = result.filter(r => r.status === selectedStatus);
    }

    setFilteredRequests(result);
  }, [search, selectedGroup, selectedStatus, requests]);

  const getFriendlyStatus = (status) => {
    const mapping = {
      'PENDING': 'Awaiting Action',
      'APPROVED': 'Approved',
      'DONORS_ALERTED': 'Searching Donors',
      'DONOR_RESPONDED': 'Donor Responded',
      'COORDINATOR_ASSIGNED': 'Coordinating',
      'DONOR_CONFIRMED': 'Visit Confirmed',
      'FULFILLED': 'Fulfilled',
      'CANCELLED': 'Cancelled',
      'REJECTED': 'Denied',
      'NO_DONOR_FOUND': 'No Donor Found'
    };
    return mapping[status] || status;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
      case 'DONORS_ALERTED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'DONOR_RESPONDED':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'COORDINATOR_ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DONOR_CONFIRMED':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_DONOR_FOUND':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
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
    <div className="page-stack max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Manage Requests"
          description="Browse, search, and monitor requests submitted across the platform."
        />
        <Link
          to="/blood-bank-admin/requests/create"
          className="rounded-lg bg-indigo-600 hover:bg-indigo-755 text-white font-bold px-4 py-2 text-xs shadow-sm transition"
        >
          + Create Request
        </Link>
      </div>

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
            placeholder="Search patient, hospital, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-xs focus:outline-none bg-white font-bold text-slate-600 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Awaiting Action</option>
            <option value="COORDINATOR_ASSIGNED">Coordinating</option>
            <option value="DONOR_CONFIRMED">Visit Confirmed</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* REQUESTS LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">
            No matching requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Blood Group</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Hospital Venue</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition duration-75">
                    <td className="p-4 pl-6">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-black text-xs">
                        {req.blood_group}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{req.patient_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Required Units: {req.required_units} Units</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{req.hospital_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{req.location}</div>
                    </td>
                    <td className="p-4">
                      <span className={`uppercase font-bold ${req.urgency_level === 'EMERGENCY' ? 'text-rose-600' : req.urgency_level === 'URGENT' ? 'text-amber-600' : 'text-slate-500'}`}>
                        {req.urgency_level}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>{req.creator_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{req.receiver_name ? 'Receiver Profile' : 'Staff Admin'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${getStatusBadgeStyle(req.status)}`}>
                        {getFriendlyStatus(req.status)}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        to={`/blood-bank-admin/requests/${req.id}`}
                        className="rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 transition text-xxs font-extrabold cursor-pointer"
                      >
                        Manage
                      </Link>
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
