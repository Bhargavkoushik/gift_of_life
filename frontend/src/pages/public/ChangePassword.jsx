import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import MedicalBackground from '../../components/MedicalBackground';
import ChangePasswordForm from '../../components/ChangePasswordForm';

export default function ChangePassword() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden py-10 px-4">
      <MedicalBackground variant="simple" />
      <div className="relative z-10 page-stack max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/select-role')}
            className="flex items-center text-sm font-semibold text-brand-red hover:text-brand-red-dark transition cursor-pointer"
          >
            ← Back to Account
          </button>
        </div>

        <PageHeader
          title="Change Password"
          description="Update your account password. Ensure you use a strong password."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
