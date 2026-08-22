import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as donorService from '../../../services/donorService';

export default function DonorAvailability() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [availability, setAvailability] = useState({
    availability_status: 'AVAILABLE',
    eligibility_status: 'PENDING',
    deferred_until: null,
    last_donation_date: null
  });
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const data = await donorService.getDonorAvailability();
        if (data) {
          setAvailability(data);
        }
      } catch (err) {
        setErrorMsg('Failed to load availability status. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadAvailability();
  }, []);

  const handleToggle = async (newStatus) => {
    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updatedStatus = await donorService.updateDonorAvailability(newStatus);
      setAvailability((prev) => ({
        ...prev,
        availability_status: updatedStatus
      }));
      setSuccessMsg(`Your discovery status has been updated successfully to ${newStatus === 'AVAILABLE' ? 'Ready to Donate' : 'Not Ready Right Now'}.`);
    } catch (err) {
      setErrorMsg('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const isAvailable = availability.availability_status === 'AVAILABLE';

  return (
    <div className="page-stack max-w-xl">
      <PageHeader
        title="Donation Status"
        description="Control your active search discovery status and review your medical records below."
      />

      <div className="space-y-6">
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-850 border border-emerald-100 leading-relaxed select-none">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 leading-relaxed select-none">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Discovery Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1 pr-4">
              <h3 className="text-base font-bold text-slate-900">Discovery Status</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setting your status to "Ready to Donate" makes your profile visible to coordinators for compatibility matching.
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border select-none ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              ● {isAvailable ? 'Ready to Donate' : 'Not Ready Right Now'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <button
              onClick={() => handleToggle('AVAILABLE')}
              disabled={updating || isAvailable}
              className={`rounded-xl border p-4 text-left transition select-none ${
                isAvailable
                  ? 'border-brand-red bg-red-50/20 text-brand-red ring-2 ring-brand-red/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
              }`}
            >
              <div className="text-sm font-bold">Ready to Donate</div>
              <div className="text-xs text-slate-500 mt-1">Appear in matching queries for local blood requests when available.</div>
            </button>

            <button
              onClick={() => handleToggle('NOT_AVAILABLE')}
              disabled={updating || !isAvailable}
              className={`rounded-xl border p-4 text-left transition select-none ${
                !isAvailable
                  ? 'border-slate-400 bg-slate-50 text-slate-800 ring-2 ring-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
              }`}
            >
              <div className="text-sm font-bold">Not Ready Right Now</div>
              <div className="text-xs text-slate-500 mt-1">Hide your profile from active donor search queries temporarily.</div>
            </button>
          </div>
        </div>

        {/* Medical Eligibility Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Medical Eligibility</h3>
          
          <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xxs text-amber-800 font-bold select-none leading-relaxed">
            ⚠️ <strong>Important Notice:</strong> "Ready to Donate" refers to discovery status only. Final medical clearance and donor screening are conducted physically by staff at <strong>ASN Raju Blood Centre, Bhimavaram</strong>, during your donation visit.
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Medical eligibility is governed by health standards (weight, wellness parameters, and a minimum 3-month wait interval between donations).
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</div>
              <div className="text-sm font-bold text-slate-800 mt-1 uppercase">
                {availability.eligibility_status === 'PENDING' ? 'Pending Verification' : availability.eligibility_status}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last Donation Date</div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {availability.last_donation_date ? availability.last_donation_date.substring(0, 10) : 'No donation logged yet'}
              </div>
            </div>
          </div>

          {availability.eligibility_status === 'TEMPORARILY_DEFERRED' && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 text-xs text-amber-900 leading-relaxed">
              <strong>Temporary Deferral Active:</strong> You are deferred from blood donations until{' '}
              <span className="font-bold">
                {availability.deferred_until ? availability.deferred_until.substring(0, 10) : 'N/A'}
              </span>
              . You will automatically become eligible once this period expires.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}