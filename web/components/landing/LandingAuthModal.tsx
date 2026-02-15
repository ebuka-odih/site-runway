import React from 'react';
import { X, Lock, Mail, Loader2, TrendingUp } from 'lucide-react';
import type { AuthView, SignupFormState } from './types';

interface LandingAuthModalProps {
  show: boolean;
  authView: AuthView;
  isSubmitting: boolean;
  submitLabel: string;
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
  countries: readonly string[];
  authNotice: string | null;
  currentError: string | null;
  debugOtp: string | null;
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
  countries,
  authNotice,
  currentError,
  debugOtp,
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Background blur inside modal */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <button
          onClick={closeAuth}
          className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
            <TrendingUp className="text-black" size={32} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight text-center uppercase italic">RunwayAlgo</h2>
          {authView === 'login' && <p className="text-zinc-500 font-bold text-sm mt-2">Welcome back to the terminal.</p>}
          {authView === 'signup' && <p className="text-zinc-500 font-bold text-sm mt-2">Create your account with email only.</p>}
          {authView === 'verify' && <p className="text-zinc-500 font-bold text-sm mt-2">Verify your email with a 6-digit OTP.</p>}
          {authView === 'forgot' && <p className="text-zinc-500 font-bold text-sm mt-2">We will send an OTP to your email.</p>}
          {authView === 'reset' && <p className="text-zinc-500 font-bold text-sm mt-2">Set a new password with your OTP code.</p>}
        </div>

        {isSubmitting ? (
          <div className="py-12 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
            <div className="relative mb-8">
              <Loader2 size={48} className="text-emerald-500 animate-spin" strokeWidth={3} />
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse" />
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => switchAuthView('forgot')}
                    className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => switchAuthView('signup')}
                    className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                  >
                    Create account
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
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
                  placeholder="Username"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={signupForm.username}
                  onChange={(event) => setSignupField('username', event.target.value)}
                />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={signupForm.name}
                  onChange={(event) => setSignupField('name', event.target.value)}
                />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={signupForm.email}
                  onChange={(event) => setSignupField('email', event.target.value)}
                />
                <select
                  required
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                  value={signupForm.country}
                  onChange={(event) => setSignupField('country', event.target.value)}
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  placeholder="Phone number"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={signupForm.phone}
                  onChange={(event) => setSignupField('phone', event.target.value)}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={signupForm.password}
                  onChange={(event) => setSignupField('password', event.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  Create Account
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  ALREADY REGISTERED?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className="text-emerald-500 font-black uppercase tracking-widest">
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
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
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
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold tracking-[0.3em] text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={verifyOtp}
                  onChange={(event) => setVerifyOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  Verify Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="w-full py-3 border border-white/10 rounded-2xl text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:border-emerald-500/40 transition-colors"
                >
                  Resend OTP
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  WRONG ACCOUNT?{' '}
                  <button type="button" onClick={() => switchAuthView('signup')} className="text-emerald-500 font-black uppercase tracking-widest">
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
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  Send OTP
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  REMEMBERED IT?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className="text-emerald-500 font-black uppercase tracking-widest">
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
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
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
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold tracking-[0.3em] text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={resetOtp}
                  onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="New password"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  Reset Password
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  NEED LOGIN?{' '}
                  <button type="button" onClick={() => switchAuthView('login')} className="text-emerald-500 font-black uppercase tracking-widest">
                    BACK TO LOGIN
                  </button>
                </p>
              </form>
            )}

            {authNotice && (
              <p className="text-emerald-400 text-xs font-bold text-center">{authNotice}</p>
            )}
            {currentError && (
              <p className="text-red-400 text-xs font-bold text-center">
                {currentError}
              </p>
            )}
            {debugOtp && (
              <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest">
                Dev OTP: <span className="text-emerald-500">{debugOtp}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingAuthModal;
