import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

export default function AdminDonorDetails() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadDetails() {
      try {
        const details = await adminService.getDonorDetails(id);
        setData(details);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to load donor details.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="page-stack max-w-4xl">
        <div className="flex items-center gap-2 text-xxs font-bold text-slate-405 uppercase tracking-wider mb-2">
          <Link to="/admin/donors" className="hover:text-brand-red">← Back to Donors</Link>
        </div>
        <PageHeader title="Donor Details" />
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      </div>
    );
  }

  const { donor, donationHistory, responsesHistory } = data;

  return (
    <div className="page-stack max-w-4xl relative select-none">
      <div className="flex items-center gap-2 text-xxs font-bold text-slate-450 uppercase tracking-wider mb-2">
        <Link to="/admin/donors" className="hover:text-brand-red">← Back to Donors</Link>
      </div>

      <PageHeader
        title={`${donor.name}`}
        description="Verify donor statistics, location areas, and donation histories."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: IDENTITY & ACCOUNT SUMMARY */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center space-y-4">
            <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-brand-red font-black text-xl font-sans mx-auto">
              {donor.blood_group}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 leading-tight">{donor.name}</h3>
              <span className="text-[9px] text-slate-400 font-bold block mt-1">{donor.email}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xxs font-semibold">
              <span className="text-slate-450 block uppercase font-bold text-[8px] mb-1">Availability Status</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 border uppercase font-bold text-[8px] ${getStatusBadgeStyle(donor.availability_status)}`}>
                {getFriendlyStatus(donor.availability_status)}
              </span>
            </div>
          </div>

          {/* DONOR OVERVIEW SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="text-xxs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Donor Overview
            </h4>
            <div className="grid gap-3 text-xxs leading-normal font-semibold text-slate-500">
              <div>
                <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Blood Group</strong>
                <span className="text-slate-800 text-xs font-bold">{donor.blood_group}</span>
              </div>
              <div>
                <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">District / Locality</strong>
                <span className="text-slate-800">{donor.district || 'N/A'} · {donor.area || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Account Status</strong>
                <span className="text-slate-800 uppercase">{donor.status || 'INACTIVE'}</span>
              </div>
              <div>
                <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Phone Contact</strong>
                <span className="text-slate-850 font-mono">{donor.phone || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-0.5">Registered Date</strong>
                <span className="text-slate-850">{new Date(donor.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT/CENTER: DONATIONS AND REQUEST ACTIVITIES */}
        <div className="md:col-span-2 space-y-6">
          {/* DONATION SUMMARY & LEDGER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-905 font-sans border-b border-slate-100 pb-3 flex justify-between items-center">
              <span>Donations Ledger</span>
              <span className="text-xxs font-extrabold text-slate-500">
                {donor.donations_count || 0} COMPLETED
              </span>
            </h3>

            {donationHistory.length === 0 ? (
              <div className="text-slate-400 font-semibold text-xxs text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                No verified donation records found for this donor profile.
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {donationHistory.map(donation => (
                  <div key={donation.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 text-xxs font-semibold">
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">
                        {new Date(donation.donation_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </strong>
                      <span className="text-slate-400 font-medium block">
                        Patient: {donation.patient_name || 'Voluntary Donation'} ({donation.hospital_name || 'ASN Raju Blood Centre'})
                      </span>
                      {donation.verified_by_name && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Verified by coordinator: {donation.verified_by_name}
                        </span>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-slate-800 font-bold block">{donation.units} Units</span>
                      <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[9px] font-bold border border-emerald-100 uppercase">
                        {donation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REQUEST ACTIVITY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-905 font-sans border-b border-slate-100 pb-3">
              Request Response Activity
            </h3>

            {responsesHistory.length === 0 ? (
              <div className="text-slate-400 font-semibold text-xxs text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                No request alerts responded to by this donor.
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {responsesHistory.map((resp, index) => (
                  <div key={index} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 text-xxs font-semibold">
                    <div className="space-y-0.5">
                      <strong className="text-slate-800">
                        Responded to Patient: {resp.patient_name}
                      </strong>
                      <span className="text-slate-400 font-medium block">
                        Hospital: {resp.hospital_name} · Group: {resp.blood_group}
                      </span>
                      {resp.notes && (
                        <span className="text-[10px] text-slate-450 block italic mt-0.5">
                          "{resp.notes}"
                        </span>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {new Date(resp.responded_at).toLocaleDateString()}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                        resp.response_status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-705 border-emerald-100' : 'bg-rose-50 text-rose-705 border-rose-100'
                      }`}>
                        {resp.response_status === 'ACCEPTED' ? 'Accepted' : 'Declined'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACCOUNT ACTIVITY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-905 font-sans border-b border-slate-100 pb-2">
              System Account Activity
            </h3>
            <div className="grid gap-3 grid-cols-2 text-xxs leading-normal font-semibold text-slate-500">
              <div>
                <span className="text-slate-405 block uppercase font-bold text-[8px] mb-0.5">First Login Milestone</span>
                <span className="text-slate-800 font-mono">
                  {donor.first_login_at ? new Date(donor.first_login_at).toLocaleString() : 'Never logged in'}
                </span>
              </div>
              <div>
                <span className="text-slate-405 block uppercase font-bold text-[8px] mb-0.5">Last Check-In Time</span>
                <span className="text-slate-800 font-mono">
                  {donor.last_login_at ? new Date(donor.last_login_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
