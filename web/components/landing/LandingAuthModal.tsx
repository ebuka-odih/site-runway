import React from 'react';
import { X, Lock, Mail, Loader2, TrendingUp } from 'lucide-react';
import { resolveBrandName } from '../../lib/branding';
import type { AuthView, SignupFormState } from './types';

interface LandingAuthModalProps {
  show: boolean;
  authView: AuthView;
  isSubmitting: boolean;
  submitLabel: string;
  theme?: 'default' | 'crypto';
  brandName?: string;
  closeAuth: () => void;
  email: string;
  password: string;
  signupForm: SignupFormState;
  verifyEmail: string;
  verifyOtp: string;
  forgotEmail: string;
  resetEmail: string;
  resetOtp: string;
  resetPassword: string;
  currencies: readonly string[];
  authNotice: string | null;
  currentError: string | null;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setSignupField: (key: keyof SignupFormState, value: string) => void;
  setVerifyEmail: (value: string) => void;
  setVerifyOtp: (value: string) => void;
  setForgotEmail: (value: string) => void;
  setResetEmail: (value: string) => void;
  setResetOtp: (value: string) => void;
  setResetPassword: (value: string) => void;
  switchAuthView: (view: AuthView) => void;
  handleLogin: (event: React.FormEvent) => void | Promise<void>;
  handleSignup: (event: React.FormEvent) => void | Promise<void>;
  handleVerifyOtp: (event: React.FormEvent) => void | Promise<void>;
  handleResendOtp: () => void | Promise<void>;
  handleForgotPassword: (event: React.FormEvent) => void | Promise<void>;
  handleResetPassword: (event: React.FormEvent) => void | Promise<void>;
}

const LandingAuthModal: React.FC<LandingAuthModalProps> = ({
  show,
  authView,
  isSubmitting,
  submitLabel,
  theme = 'default',
  brandName,
  closeAuth,
  email,
  password,
  signupForm,
  verifyEmail,
  verifyOtp,
  forgotEmail,
  resetEmail,
  resetOtp,
  resetPassword,
  currencies,
  authNotice,
  currentError,
  setEmail,
  setPassword,
  setSignupField,
  setVerifyEmail,
  setVerifyOtp,
  setForgotEmail,
  setResetEmail,
  setResetOtp,
  setResetPassword,
  switchAuthView,
  handleLogin,
  handleSignup,
  handleVerifyOtp,
  handleResendOtp,
  handleForgotPassword,
  handleResetPassword,
}) => {
  if (!show) {
    return null;
  }

  const resolvedBrandName = resolveBrandName(brandName);
  const isCryptoTheme = theme === 'crypto';
  const inputClass = `w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 ${isCryptoTheme ? 'focus:border-cyan-400/40' : 'focus:border-emerald-500/40'}`;
  const inputWithIconClass = `w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 ${isCryptoTheme ? 'focus:border-cyan-400/40' : 'focus:border-emerald-500/40'}`;
  const linkButtonClass = `text-[10px] font-black uppercase tracking-widest ${isCryptoTheme ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-500 hover:text-emerald-400'}`;
  const primaryActionClass = `w-full py-4 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl active:scale-[0.98] transition-all ${isCryptoTheme ? 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/10' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10'}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Background blur inside modal */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 ${isCryptoTheme ? 'bg-cyan-500/10' : 'bg-emerald-500/10'}`} />
        <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2 ${isCryptoTheme ? 'bg-cyan-500/10' : 'bg-emerald-500/10'}`} />

        <button
          onClick={closeAuth}
          className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-10">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-6 ${isCryptoTheme ? 'from-cyan-300 to-blue-500 shadow-cyan-500/20' : 'from-emerald-400 to-emerald-600 shadow-emerald-500/20'}`}>
            <TrendingUp className="text-black" size={32} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight text-center">{resolvedBrandName}</h2>
          {authView === 'login' && <p className="text-zinc-500 font-bold text-sm mt-2">Welcome back to the terminal.</p>}
          {authView === 'signup' && <p className="text-zinc-500 font-bold text-sm mt-2">Create your account with email only.</p>}
          {authView === 'verify' && <p className="text-zinc-500 font-bold text-sm mt-2">Verify your email with a 6-digit OTP.</p>}
          {authView === 'forgot' && <p className="text-zinc-500 font-bold text-sm mt-2">We will send an OTP to your email.</p>}
          {authView === 'reset' && <p className="text-zinc-500 font-bold text-sm mt-2">Set a new password with your OTP code.</p>}
        </div>

        {isSubmitting ? (
          <div className="py-12 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
            <div className="relative mb-8">
              <Loader2 size={48} className={`animate-spin ${isCryptoTheme ? 'text-cyan-400' : 'text-emerald-500'}`} strokeWidth={3} />
              <div className={`absolute inset-0 blur-2xl animate-pulse ${isCryptoTheme ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">{submitLabel}</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Please wait...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors ${isCryptoTheme ? 'group-focus-within:text-cyan-400' : 'group-focus-within:text-emerald-500'}`} size={20} />
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
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors ${isCryptoTheme ? 'group-focus-within:text-cyan-400' : 'group-focus-within:text-emerald-500'}`} size={20} />
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
                  <button
                    type="button"
                    onClick={() => switchAuthView('forgot')}
                    className={linkButtonClass}
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => switchAuthView('signup')}
                    className={linkButtonClass}
                  >
                    Create account
                  </button>
                </div>
                <button
                  type="submit"
                  className={primaryActionClass}
                >
                  Enter Terminal
                </button>
              </form>
            )}

            {authView === 'signup' && (
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
                  {currencies.map((currency) => (
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
                <button
                  type="submit"
                  className={primaryActionClass}
                >
                  Create Account
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  ALREADY REGISTERED?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className={`font-black uppercase tracking-widest ${isCryptoTheme ? 'text-cyan-400' : 'text-emerald-500'}`}>
                    LOGIN
                  </button>
                </p>
              </form>
            )}

            {authView === 'verify' && (
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
                <button
                  type="submit"
                  className={primaryActionClass}
                >
                  Verify Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className={`w-full py-3 border border-white/10 rounded-2xl text-[10px] font-black text-zinc-300 uppercase tracking-widest transition-colors ${isCryptoTheme ? 'hover:border-cyan-400/40' : 'hover:border-emerald-500/40'}`}
                >
                  Resend OTP
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  WRONG ACCOUNT?{' '}
                  <button type="button" onClick={() => switchAuthView('signup')} className={`font-black uppercase tracking-widest ${isCryptoTheme ? 'text-cyan-400' : 'text-emerald-500'}`}>
                    SIGN UP AGAIN
                  </button>
                </p>
              </form>
            )}

            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className={inputClass}
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                />
                <button
                  type="submit"
                  className={primaryActionClass}
                >
                  Send OTP
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  REMEMBERED IT?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className={`font-black uppercase tracking-widest ${isCryptoTheme ? 'text-cyan-400' : 'text-emerald-500'}`}>
                    BACK TO LOGIN
                  </button>
                </p>
              </form>
            )}

            {authView === 'reset' && (
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
                <button
                  type="submit"
                  className={primaryActionClass}
                >
                  Reset Password
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  NEED LOGIN?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className={`font-black uppercase tracking-widest ${isCryptoTheme ? 'text-cyan-400' : 'text-emerald-500'}`}>
                    BACK TO LOGIN
                  </button>
                </p>
              </form>
            )}

            {authNotice && (
              <p className={`text-xs font-bold text-center ${isCryptoTheme ? 'text-cyan-300' : 'text-emerald-400'}`}>{authNotice}</p>
            )}
            {currentError && (
              <p className="text-red-400 text-xs font-bold text-center">
                {currentError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingAuthModal;
