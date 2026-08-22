import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as bloodBankAdminService from '../../../services/bloodBankAdminService';

export default function CreateRequest() {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [requiredUnits, setRequiredUnits] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [location, setLocation] = useState('Bhimavaram');
  const [requiredDateTime, setRequiredDateTime] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('NORMAL');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Duplicate modal states
  const [duplicateRequestId, setDuplicateRequestId] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const navigate = useNavigate();
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    // Validate future date in frontend
    const reqDate = new Date(requiredDateTime);
    if (reqDate < new Date()) {
      setErrorMsg('Required date and time must be in the future.');
      setLoading(false);
      return;
    }

    try {
      await bloodBankAdminService.createBloodRequest({
        blood_group: bloodGroup,
        required_units: parseInt(requiredUnits, 10),
        patient_name: patientName,
        hospital_name: hospitalName,
        hospital_address: hospitalAddress,
        location,
        required_date_time: requiredDateTime,
        urgency_level: urgencyLevel,
        description: description || null
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/blood-bank-admin/requests');
      }, 2000);
    } catch (err) {
      if (err.response?.data?.code === 'DUPLICATE_ACTIVE_REQUEST') {
        setDuplicateRequestId(err.response.data.requestId);
        setShowDuplicateModal(true);
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit blood request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack max-w-2xl">
      <PageHeader
        title="Create Blood Request"
        description="Submit blood requirements directly. Sourced matches will physically visit the trust location."
      />

      <div className="space-y-4">
        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 leading-relaxed select-none">
            ✓ Request submitted successfully! Redirecting to requests...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xxs text-indigo-800 font-semibold leading-relaxed">
            ℹ️ <strong>Admin Notice:</strong> Creating this request will register it under the system and automatically run donor compatibility checks in the patient's area.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rama Rao"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Group Required</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-700"
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Required Units</label>
              <input
                type="number"
                required
                min={1}
                value={requiredUnits}
                onChange={(e) => setRequiredUnits(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Urgency Level</label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-700"
              >
                <option value="NORMAL">Normal (Standard Review)</option>
                <option value="URGENT">Urgent (Immediate Check)</option>
                <option value="EMERGENCY">Emergency (Life Critical)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Required Date & Time</label>
              <input
                type="datetime-local"
                required
                value={requiredDateTime}
                onChange={(e) => setRequiredDateTime(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none font-bold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location City/Town</label>
              <input
                type="text"
                required
                placeholder="e.g. Bhimavaram"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hospital Name</label>
              <input
                type="text"
                required
                placeholder="e.g. ASN Raju Trust Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hospital Address</label>
              <textarea
                required
                rows={3}
                placeholder="Physical address for coordination..."
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Case Details (Optional)</label>
              <textarea
                rows={2}
                placeholder="E.g. Bypass surgery details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-650 py-3 text-xs font-bold text-white hover:bg-indigo-750 transition cursor-pointer"
          >
            {loading ? 'Submitting Request...' : 'Submit Blood Request'}
          </button>
        </form>
      </div>

      {/* DUPLICATE ACTIVE REQUEST WARNING MODAL */}
      {showDuplicateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 space-y-4 font-semibold text-slate-700 text-xs">
            <h3 className="text-sm font-black text-rose-650 select-none">
              This blood request already exists.
            </h3>
            
            <p className="text-slate-500 leading-relaxed font-sans text-xxs select-none">
              An active request with the same details is already in the system.
            </p>
            
            <div className="flex justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 cursor-pointer transition text-xxs"
              >
                Close
              </button>
              {duplicateRequestId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateModal(false);
                    navigate(`/blood-bank-admin/requests/${duplicateRequestId}`);
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 cursor-pointer transition text-xxs"
                >
                  View existing request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
