import React, { useMemo, useState } from 'react';
import {
  apiForgotPassword,
  apiRegister,
  apiResendEmailOtp,
  apiResetPasswordWithOtp,
  apiVerifyEmailOtp,
  setAuthToken,
} from '../lib/api';
import LandingMarketing from './landing/LandingMarketing';
import LandingAuthModal from './landing/LandingAuthModal';
import type { AuthView, SignupFormState } from './landing/types';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  authError: string | null;
}

const BASE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, authError }) => {
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
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const switchAuthView = (view: AuthView) => {
    setAuthView(view);
    setAuthNotice(null);
    setLocalError(null);
    setDebugOtp(null);
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
    setDebugOtp(null);
    setIsSubmitting(true);

    try {
      const normalizedName = signupForm.name.trim();
      const normalizedEmail = signupForm.email.trim().toLowerCase();
      const generatedUsername = buildAutoUsername(normalizedName, normalizedEmail);

      const payload = await apiRegister({
        username: generatedUsername,
        name: normalizedName,
        email: normalizedEmail,
        country: signupForm.currency,
        phone: signupForm.phone.trim(),
        password: signupForm.password,
      });

      setVerifyEmail(payload.email);
      setVerifyOtp(payload.debugOtp ?? '');
      setDebugOtp(payload.debugOtp ?? null);
      setAuthNotice('Account created. Enter the OTP sent to your email to verify.');
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
    setDebugOtp(null);
    setIsSubmitting(true);

    try {
      const payload = await apiResendEmailOtp(verifyEmail.trim().toLowerCase());
      setVerifyOtp(payload.debugOtp ?? '');
      setDebugOtp(payload.debugOtp ?? null);
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
    setDebugOtp(null);
    setIsSubmitting(true);

    try {
      const payload = await apiForgotPassword(forgotEmail.trim().toLowerCase());
      const normalizedEmail = forgotEmail.trim().toLowerCase();

      setResetEmail(normalizedEmail);
      setResetOtp(payload.debugOtp ?? '');
      setDebugOtp(payload.debugOtp ?? null);
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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20">
          <div className="h-full w-full bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
      </div>

      <LandingMarketing onOpenAuth={openAuth} />

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
        debugOtp={debugOtp}
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

export default LandingPage;
