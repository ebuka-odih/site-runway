import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, TrendingUp } from 'lucide-react';
import {
  apiForgotPassword,
  apiRegister,
  apiResendEmailOtp,
  apiResetPasswordWithOtp,
  apiVerifyEmailOtp,
  setAuthToken,
} from '../lib/api';
import { resolveBrandName } from '../lib/branding';
import type { AuthView, SignupFormState } from './landing/types';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  authError: string | null;
  view: AuthView;
  brandName?: string;
}

interface AuthNavigationState {
  verifyEmail?: string;
  resetEmail?: string;
  authNotice?: string;
}

const BASE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
const DEFAULT_SIGNUP_COUNTRY = 'United States';

const AUTH_ROUTE_BY_VIEW: Record<AuthView, string> = {
  login: '/login',
  signup: '/signup',
  verify: '/verify',
  forgot: '/forgot',
  reset: '/reset',
};

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, authError, view, brandName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedBrandName = resolveBrandName(brandName);
  const navState = (location.state ?? {}) as AuthNavigationState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupForm, setSignupForm] = useState<SignupFormState>({
    name: '',
    email: '',
    currency: BASE_CURRENCIES[0],
    phone: '',
    password: '',
  });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (navState.verifyEmail) {
      setVerifyEmail(navState.verifyEmail);
    }

    if (navState.resetEmail) {
      setResetEmail(navState.resetEmail);
      setForgotEmail(navState.resetEmail);
    }

    if (navState.authNotice) {
      setAuthNotice(navState.authNotice);
    }
  }, [navState.authNotice, navState.resetEmail, navState.verifyEmail]);

  useEffect(() => {
    setLocalError(null);
  }, [view]);

  const submitLabel = useMemo(() => {
    if (view === 'signup') return 'Creating account';
    if (view === 'verify') return 'Verifying account';
    if (view === 'forgot') return 'Sending OTP';
    if (view === 'reset') return 'Resetting password';
    return 'Authenticating';
  }, [view]);

  const currentError = localError ?? (view === 'login' ? authError : null);
  const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

  const buildAutoUsername = (name: string, emailAddress: string): string => {
    const firstName = name.trim().split(/\s+/)[0] ?? '';
    const emailPrefix = emailAddress.trim().split('@')[0] ?? '';
    const baseSeed = firstName || emailPrefix || 'user';
    const base = baseSeed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
    const paddedBase = base.length >= 3 ? base : `${base}user`.slice(0, 3);
    const hash = Array.from(emailAddress.toLowerCase()).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000, 0);
    const suffix = hash.toString().padStart(3, '0');
    return `${paddedBase}${suffix}`;
  };

  const switchAuthView = (nextView: AuthView) => {
    setLocalError(null);
    setAuthNotice(null);
    navigate(AUTH_ROUTE_BY_VIEW[nextView]);
  };

  const setSignupField = (key: keyof SignupFormState, value: string) => {
    setSignupForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    const success = await onLogin(email, password);
    setIsSubmitting(false);

    if (!success) {
      setLocalError(authError ?? null);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    try {
      const normalizedName = signupForm.name.trim();
      const normalizedEmail = signupForm.email.trim().toLowerCase();
      const generatedUsername = buildAutoUsername(normalizedName, normalizedEmail);

      const payload = await apiRegister({
        username: generatedUsername,
        name: normalizedName,
        email: normalizedEmail,
        country: DEFAULT_SIGNUP_COUNTRY,
        currency: signupForm.currency,
        phone: signupForm.phone.trim(),
        password: signupForm.password,
      });

      setVerifyOtp('');
      navigate(AUTH_ROUTE_BY_VIEW.verify, {
        state: {
          verifyEmail: payload.email,
          authNotice: 'Verification OTP sent. Enter the code from your email to complete signup.',
        } satisfies AuthNavigationState,
      });
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to create account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    try {
      const payload = await apiVerifyEmailOtp(verifyEmail.trim().toLowerCase(), verifyOtp.trim(), 'web-terminal');
      setAuthToken(payload.token);
      window.location.reload();
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to verify OTP.'));
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    try {
      await apiResendEmailOtp(verifyEmail.trim().toLowerCase());
      setVerifyOtp('');
      setAuthNotice('A fresh OTP has been sent.');
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to resend OTP right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    try {
      await apiForgotPassword(forgotEmail.trim().toLowerCase());
      const normalizedEmail = forgotEmail.trim().toLowerCase();
      setResetOtp('');
      navigate(AUTH_ROUTE_BY_VIEW.reset, {
        state: {
          resetEmail: normalizedEmail,
          authNotice: 'OTP sent. Enter it with your new password.',
        } satisfies AuthNavigationState,
      });
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to send password reset OTP.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setAuthNotice(null);
    setIsSubmitting(true);

    try {
      await apiResetPasswordWithOtp(resetEmail.trim().toLowerCase(), resetOtp.trim(), resetPassword);
      setEmail(resetEmail.trim().toLowerCase());
      setPassword('');
      setResetPassword('');
      setResetOtp('');
      navigate(AUTH_ROUTE_BY_VIEW.login, {
        state: { authNotice: 'Password reset successful. You can log in now.' } satisfies AuthNavigationState,
      });
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 focus:border-emerald-500/40';
  const inputWithIconClass = 'w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 focus:border-emerald-500/40';
  const linkButtonClass = 'text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300';
  const primaryActionClass = 'w-full py-4 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl active:scale-[0.98] transition-all bg-[#059669] hover:bg-[#047857] shadow-[0_0_18px_rgba(5,150,105,0.25)]';

  return (
    <div className="min-h-screen bg-[#050B14] text-white overflow-x-hidden selection:bg-[#064E3B]/30">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-15%] right-[-15%] h-[35rem] w-[35rem] rounded-full bg-[#059669]/15 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-[#059669]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:44px_44px] opacity-20" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[40px] border border-white/10 bg-[#0A0F1A] p-8 shadow-2xl md:p-12">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#059669]">
              Back Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#059669] text-white shadow-lg shadow-[0_0_10px_rgba(5,150,105,0.3)]">
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black tracking-[0.08em] text-white">{resolvedBrandName}</span>
            </div>
          </div>

          <div className="mb-8">
            {view === 'login' && <h1 className="text-2xl font-black uppercase tracking-tight">Log In</h1>}
            {view === 'signup' && <h1 className="text-2xl font-black uppercase tracking-tight">Create Account</h1>}
            {view === 'verify' && <h1 className="text-2xl font-black uppercase tracking-tight">Verify Email OTP</h1>}
            {view === 'forgot' && <h1 className="text-2xl font-black uppercase tracking-tight">Forgot Password</h1>}
            {view === 'reset' && <h1 className="text-2xl font-black uppercase tracking-tight">Reset Password</h1>}
            <p className="mt-2 text-sm font-bold text-zinc-500">Secure access to your crypto dashboard.</p>
          </div>

          {isSubmitting ? (
            <div className="py-8 text-center">
              <Loader2 size={40} className="mx-auto animate-spin text-[#059669]" strokeWidth={3} />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-400">{submitLabel}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-400" size={20} />
                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        className={inputWithIconClass}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-400" size={20} />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        className={inputWithIconClass}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <button type="button" onClick={() => switchAuthView('forgot')} className={linkButtonClass}>
                      Forgot password?
                    </button>
                    <button type="button" onClick={() => switchAuthView('signup')} className={linkButtonClass}>
                      Create account
                    </button>
                  </div>
                  <button type="submit" className={primaryActionClass}>
                    Enter Terminal
                  </button>
                </form>
              )}

              {view === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    className={inputClass}
                    value={signupForm.name}
                    onChange={(event) => setSignupField('name', event.target.value)}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className={inputClass}
                    value={signupForm.email}
                    onChange={(event) => setSignupField('email', event.target.value)}
                  />
                  <select
                    required
                    className={inputClass}
                    value={signupForm.currency}
                    onChange={(event) => setSignupField('currency', event.target.value)}
                  >
                    {BASE_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    className={inputClass}
                    value={signupForm.phone}
                    onChange={(event) => setSignupField('phone', event.target.value)}
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Password"
                    className={inputClass}
                    value={signupForm.password}
                    onChange={(event) => setSignupField('password', event.target.value)}
                  />
                  <button type="submit" className={primaryActionClass}>
                    Create Account
                  </button>
                  <p className="text-center text-[10px] font-bold text-zinc-600">
                    ALREADY REGISTERED?{' '}
                    <button type="button" onClick={() => switchAuthView('login')} className="font-black uppercase tracking-widest text-emerald-400">
                      LOGIN
                    </button>
                  </p>
                </form>
              )}

              {view === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className={inputClass}
                    value={verifyEmail}
                    onChange={(event) => setVerifyEmail(event.target.value)}
                  />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    className={inputClass}
                    value={verifyOtp}
                    onChange={(event) => setVerifyOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button type="submit" className={primaryActionClass}>
                    Verify Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="w-full rounded-2xl border border-white/10 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:border-emerald-500/40"
                  >
                    Resend OTP
                  </button>
                  <p className="text-center text-[10px] font-bold text-zinc-600">
                    WRONG ACCOUNT?{' '}
                    <button type="button" onClick={() => switchAuthView('signup')} className="font-black uppercase tracking-widest text-emerald-400">
                      SIGN UP AGAIN
                    </button>
                  </p>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className={inputClass}
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                  <button type="submit" className={primaryActionClass}>
                    Send OTP
                  </button>
                  <p className="text-center text-[10px] font-bold text-zinc-600">
                    REMEMBERED IT?{' '}
                    <button type="button" onClick={() => switchAuthView('login')} className="font-black uppercase tracking-widest text-emerald-400">
                      BACK TO LOGIN
                    </button>
                  </p>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className={inputClass}
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                  />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    className={inputClass}
                    value={resetOtp}
                    onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="New password"
                    className={inputClass}
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                  />
                  <button type="submit" className={primaryActionClass}>
                    Reset Password
                  </button>
                  <p className="text-center text-[10px] font-bold text-zinc-600">
                    NEED LOGIN?{' '}
                    <button type="button" onClick={() => switchAuthView('login')} className="font-black uppercase tracking-widest text-emerald-400">
                      BACK TO LOGIN
                    </button>
                  </p>
                </form>
              )}

              {authNotice && <p className="text-center text-xs font-bold text-emerald-400">{authNotice}</p>}
              {currentError && <p className="text-center text-xs font-bold text-red-400">{currentError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
