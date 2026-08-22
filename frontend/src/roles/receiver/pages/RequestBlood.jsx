import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as receiverService from '../../../services/receiverService';
import { useAuth } from '../../../context/AuthContext';

export default function RequestBlood() {
  const { user: currentUser } = useAuth();
  const [requestFor, setRequestFor] = useState('SOMEONE_ELSE');
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
      await receiverService.createBloodRequest({
        blood_group: bloodGroup,
        required_units: parseInt(requiredUnits, 10),
        patient_name: patientName,
        hospital_name: hospitalName,
        hospital_address: hospitalAddress,
        location,
        required_date_time: requiredDateTime,
        urgency_level: urgencyLevel,
        description: description || null,
        relation_type: requestFor
      });

      setSuccess(true);
      // Reset form
      setPatientName('');
      setHospitalName('');
      setHospitalAddress('');
      setDescription('');
      setRequiredDateTime('');
      
      setTimeout(() => {
        navigate('/receiver/requests');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit blood request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack max-w-2xl">
      <PageHeader
        title="Request Blood"
        description="Submit patient details and blood requirements. Coordination is handled through ASN Raju Charitable Trust."
      />

      <div className="space-y-4">
        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-850 border border-emerald-100 leading-relaxed select-none">
            ✓ Request submitted successfully! Redirecting to your requests listing...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xxs text-slate-550 font-semibold leading-relaxed">
            ℹ️ <strong>Workflow Notice:</strong> This request will be reviewed and coordinated through the <strong>ASN Raju Charitable Trust, Bhimavaram</strong>. An assigned coordinator will contact you to verify patient records before alerting compatible local donors.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Who is this request for?</label>
              <select
                value={requestFor}
                onChange={(e) => {
                  const val = e.target.value;
                  setRequestFor(val);
                  if (val === 'MYSELF') {
                    setPatientName(currentUser?.name || '');
                  } else {
                    setPatientName('');
                  }
                }}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none bg-white cursor-pointer font-bold text-slate-700"
              >
                <option value="SOMEONE_ELSE">Someone else</option>
                <option value="MYSELF">Myself</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rama Rao"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={loading || requestFor === 'MYSELF'}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none disabled:bg-slate-50"
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
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
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
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none font-bold text-slate-700"
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
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
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
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
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
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Case Details (Optional)</label>
              <textarea
                rows={2}
                placeholder="E.g. Bypass surgery, patient card details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-brand-red focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-red py-3 text-xs font-bold text-white hover:bg-brand-red-dark transition cursor-pointer"
          >
            {loading ? 'Submitting Request...' : 'Submit Blood Request'}
          </button>
        </form>
      </div>
    </div>
  );
}