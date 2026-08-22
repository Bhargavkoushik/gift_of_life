import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MedicalBackground from '../../components/MedicalBackground';

export default function VerifyAccount() {
  const { user, sendVerificationOtp, verifyOtp, getAuthConfig, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('select'); // 'select' | 'otp' | 'success'
  const [method, setMethod] = useState('EMAIL'); // 'EMAIL' | 'SMS'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Timer states
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes in seconds

  const otpInputRefs = useRef([]);

  // Fetch SMS configuration capability on mount
  useEffect(() => {
    async function checkSms() {
      try {
        const config = await getAuthConfig();
        setSmsEnabled(!!config.sms_enabled);
      } catch (err) {
        console.error('Failed to fetch SMS capability:', err);
        setSmsEnabled(false);
      }
    }
    checkSms();
  }, [getAuthConfig]);

  useEffect(() => {
    // If user is already verified, send them to select role
    if (user && user.is_verified && step !== 'success') {
      navigate('/select-role', { replace: true });
    }
  }, [user, navigate, step]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Expiration countdown timer
  useEffect(() => {
    if (step === 'otp' && expiresIn > 0) {
      const timer = setTimeout(() => setExpiresIn(expiresIn - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, expiresIn]);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}**@${domain}`;
    return `${name.substring(0, 2)}****@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length <= 4) return '****';
    return `******${clean.substring(clean.length - 4)}`;
  };

  const handleSendOtp = async (selectedMethod = method) => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSending(true);

    try {
      const res = await sendVerificationOtp(selectedMethod);
      setCooldown(res.cooldown_seconds || 60);
      setExpiresIn(600); // Reset expiry to 10 minutes
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      setInfoMsg(`A 6-digit code has been sent to your ${selectedMethod.toLowerCase() === 'email' ? 'email address' : 'phone number'}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setSending(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSending(true);

    try {
      const res = await sendVerificationOtp(method);
      setCooldown(res.cooldown_seconds || 60);
      setExpiresIn(600); // Reset expiry to 10 minutes
      setOtp(['', '', '', '', '', '']);
      setInfoMsg('New verification code sent.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const codeStr = otp.join('');
    if (codeStr.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setVerifying(true);
    try {
      await verifyOtp(codeStr);
      setStep('success');
      setTimeout(() => {
        navigate('/select-role', { replace: true });
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpInputRefs.current[5].focus();
    }
    e.preventDefault();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Dynamic distraction-free background */}
      <MedicalBackground variant="simple" />

      {/* Minimal Header */}
      <header className="relative z-10 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-xs">
        <span className="text-base font-extrabold tracking-tight text-brand-red">Gift of Life</span>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer bg-transparent border-0 py-1 px-2.5 rounded-md hover:bg-slate-100"
        >
          Sign out
        </button>
      </header>

      {/* Main Form Portal */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-lg transition-all">
          
          {/* Success View */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-600 text-3xl font-extrabold mb-4">
                ✓
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Account verified</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Your account has been verified.</p>
            </div>
          )}

          {step !== 'success' && (
            <div className="space-y-6">
              {/* BACK BUTTON */}
              {step === 'otp' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  disabled={verifying || sending}
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Change verification method
                </button>
              )}

              {/* Header Title Section */}
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {step === 'select' ? 'Verify your account' : 'Enter verification code'}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {step === 'select' 
                    ? 'Before continuing, verify your email address or phone number.'
                    : `We sent a 6-digit code to ${method === 'EMAIL' ? maskEmail(user?.email) : maskPhone(user?.phone)}`
                  }
                </p>
              </div>

              {/* Alerts Callouts */}
              {errorMsg && (
                <div 
                  role="alert" 
                  className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-200"
                >
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div 
                  className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200"
                >
                  {infoMsg}
                </div>
              )}

              {/* STEP 1: METHOD SELECTION */}
              {step === 'select' && (
                <div className="space-y-6">
                  <div className="grid gap-3">
                    {/* EMAIL CARD */}
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => setMethod('EMAIL')}
                      className={`w-full rounded-xl border p-4 flex items-center justify-between text-left transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-red ${
                        method === 'EMAIL' 
                          ? 'border-brand-red bg-brand-red-light/5 ring-1 ring-brand-red' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-sm font-bold text-slate-800">✉ Email Address</span>
                        <span className="block text-xs font-medium text-slate-400">
                          {maskEmail(user?.email)}
                        </span>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        method === 'EMAIL' ? 'border-brand-red bg-brand-red' : 'border-slate-300'
                      }`}>
                        {method === 'EMAIL' && <span className="h-2 w-2 rounded-full bg-white"></span>}
                      </div>
                    </button>

                    {/* SMS CARD */}
                    <button
                      type="button"
                      disabled={!smsEnabled || sending}
                      onClick={() => setMethod('SMS')}
                      className={`w-full rounded-xl border p-4 flex items-center justify-between text-left transition ${
                        !smsEnabled 
                          ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60' 
                          : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-red ' + 
                            (method === 'SMS' 
                              ? 'border-brand-red bg-brand-red-light/5 ring-1 ring-brand-red' 
                              : 'border-slate-200 bg-white hover:border-slate-300')
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="block text-sm font-bold text-slate-800">☎ SMS (Phone)</span>
                          {!smsEnabled && (
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="block text-xs font-medium text-slate-400">
                          {smsEnabled ? maskPhone(user?.phone) : 'SMS is not configured in this environment.'}
                        </span>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        smsEnabled && method === 'SMS' ? 'border-brand-red bg-brand-red' : 'border-slate-300'
                      }`}>
                        {smsEnabled && method === 'SMS' && <span className="h-2 w-2 rounded-full bg-white"></span>}
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => handleSendOtp()}
                    disabled={sending}
                    className="w-full rounded-lg bg-brand-red py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
                  >
                    {sending ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {/* STEP 2: OTP INPUT */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* 6 Digit Input Grid (Fluid and responsive to never overflow 320px) */}
                  <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`Verification digit ${index + 1}`}
                        aria-busy={verifying}
                        disabled={verifying}
                        value={digit}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg border border-slate-300 text-center text-lg font-bold text-slate-800 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 disabled:opacity-50"
                      />
                    ))}
                  </div>

                  {/* Expiration & Countdown indicators */}
                  <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-bold select-none text-center">
                    {expiresIn > 0 ? (
                      <p>
                        Code expires in:{' '}
                        <span className={expiresIn < 60 ? 'text-red-500 font-extrabold animate-pulse' : 'text-brand-red'}>
                          {formatTime(expiresIn)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-red-500 font-bold">Code expired.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={verifying || otp.join('').length !== 6 || expiresIn === 0}
                      className="w-full rounded-lg bg-brand-red py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-red-dark disabled:bg-slate-300 cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
                    >
                      {verifying ? 'Verifying...' : 'Verify & Continue'}
                    </button>

                    <div className="text-center text-xs leading-normal font-semibold text-slate-500 pt-2 flex flex-col gap-2">
                      {expiresIn === 0 ? (
                        <div>
                          <button
                            type="button"
                            disabled={sending}
                            onClick={handleResendOtp}
                            className="w-full rounded-lg border border-brand-red py-2.5 text-xs font-bold text-brand-red hover:bg-brand-red-light/10 cursor-pointer"
                          >
                            {sending ? 'Requesting...' : 'Send new code'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          Didn't receive the code?{' '}
                          <button
                            type="button"
                            disabled={cooldown > 0 || sending}
                            onClick={handleResendOtp}
                            className="font-bold text-brand-red hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                          >
                            {cooldown > 0 ? `Resend code in ${formatTime(cooldown)}` : 'Resend code'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
