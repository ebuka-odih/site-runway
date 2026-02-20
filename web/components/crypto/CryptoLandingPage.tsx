import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  apiForgotPassword,
  apiRegister,
  apiResendEmailOtp,
  apiResetPasswordWithOtp,
  apiVerifyEmailOtp,
  setAuthToken,
} from '../../lib/api';
import LandingAuthModal from '../landing/LandingAuthModal';
import type { AuthView, SignupFormState } from '../landing/types';

interface CryptoLandingPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  authError: string | null;
}

const BASE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
const DEFAULT_SIGNUP_COUNTRY = 'United States';

const TOP_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'];

const CryptoLandingPage: React.FC<CryptoLandingPageProps> = ({ onLogin, authError }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
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

  const switchAuthView = (view: AuthView) => {
    setAuthView(view);
    setAuthNotice(null);
    setLocalError(null);
  };

  const openAuth = (view: AuthView = 'login') => {
    setShowLogin(true);
    switchAuthView(view);
  };

  const closeAuth = () => {
    if (isSubmitting) {
      return;
    }

    setShowLogin(false);
  };

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

  const submitLabel = useMemo(() => {
    if (authView === 'signup') return 'Creating account';
    if (authView === 'verify') return 'Verifying account';
    if (authView === 'forgot') return 'Sending OTP';
    if (authView === 'reset') return 'Resetting password';
    return 'Authenticating';
  }, [authView]);

  const currentError = localError ?? (authView === 'login' ? authError : null);

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

    if (success) {
      setShowLogin(false);
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

      setVerifyEmail(payload.email);
      setVerifyOtp('');
      setAuthNotice('Verification OTP sent. Enter the code from your email to complete signup.');
      setAuthView('verify');
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
      setShowLogin(false);
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

      setResetEmail(normalizedEmail);
      setResetOtp('');
      setAuthNotice('OTP sent. Enter it with your new password.');
      setAuthView('reset');
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
      setAuthNotice('Password reset successful. You can log in now.');
      setAuthView('login');
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-cyan-400/30">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-15%] right-[-15%] h-[35rem] w-[35rem] rounded-full bg-cyan-400/25 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:44px_44px] opacity-20" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-black shadow-lg shadow-cyan-500/30">
              <span className="text-lg font-black">C</span>
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.25em] text-cyan-200 uppercase">RunwayAlgo</p>
              <p className="text-xs text-zinc-300">Crypto Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:border-cyan-300"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-black transition hover:bg-cyan-300"
            >
              Start Trading
            </button>
          </div>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Real-Time Crypto Access
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Trade Crypto Momentum With Institutional-grade Signals
            </h1>
            <p className="mt-4 max-w-xl text-base text-zinc-200">
              Built for active traders who want tighter execution, faster market context, and a focused crypto-first dashboard.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-cyan-300"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="rounded-2xl border border-zinc-300/30 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-100/60"
              >
                Open Existing Account
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Execution</p>
                <p className="mt-2 text-2xl font-black text-cyan-200">&lt; 90ms</p>
                <p className="mt-1 text-xs text-zinc-400">Order router latency</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Liquidity</p>
                <p className="mt-2 text-2xl font-black text-cyan-200">24/7</p>
                <p className="mt-1 text-xs text-zinc-400">Always-on market access</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Universe</p>
                <p className="mt-2 text-2xl font-black text-cyan-200">150+</p>
                <p className="mt-1 text-xs text-zinc-400">Major and mid-cap pairs</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-cyan-300/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Top Pairs</p>
            <div className="mt-4 space-y-3">
              {TOP_PAIRS.map((pair, index) => (
                <div key={pair} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-sm font-bold text-zinc-100">{pair}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">+{(index + 1) * 1.7}%</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">Crypto Dashboard Preview</p>
              <p className="mt-2 text-sm text-zinc-100">
                Depth-aware watchlists, position analytics, copy trading, and wallet actions all mapped into one route set.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-10 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <span>Use of this product implies acceptance of trading risk.</span>
          <Link to="/risk-disclosure" className="font-semibold text-cyan-300 hover:text-cyan-200">Risk Disclosure</Link>
          <Link to="/privacy-policy" className="font-semibold text-cyan-300 hover:text-cyan-200">Privacy Policy</Link>
          <Link to="/terms-of-service" className="font-semibold text-cyan-300 hover:text-cyan-200">Terms</Link>
        </footer>
      </section>

      <LandingAuthModal
        show={showLogin}
        authView={authView}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        closeAuth={closeAuth}
        email={email}
        password={password}
        signupForm={signupForm}
        verifyEmail={verifyEmail}
        verifyOtp={verifyOtp}
        forgotEmail={forgotEmail}
        resetEmail={resetEmail}
        resetOtp={resetOtp}
        resetPassword={resetPassword}
        currencies={BASE_CURRENCIES}
        authNotice={authNotice}
        currentError={currentError}
        setEmail={setEmail}
        setPassword={setPassword}
        setSignupField={setSignupField}
        setVerifyEmail={setVerifyEmail}
        setVerifyOtp={setVerifyOtp}
        setForgotEmail={setForgotEmail}
        setResetEmail={setResetEmail}
        setResetOtp={setResetOtp}
        setResetPassword={setResetPassword}
        switchAuthView={switchAuthView}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        handleVerifyOtp={handleVerifyOtp}
        handleResendOtp={handleResendOtp}
        handleForgotPassword={handleForgotPassword}
        handleResetPassword={handleResetPassword}
      />
    </div>
  );
};

export default CryptoLandingPage;
