import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  User,
  Shield,
  ChevronRight,
  LogOut,
  Lock,
  UserCheck,
  Sparkles,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import LiveChatEmbed from './LiveChatEmbed';
import { apiConfirmKycOtp, apiPublicSettings, apiSendKycOtp, apiSubmitKyc } from '../lib/api';
import type { KycDocumentType, ProfileData, PublicSettings } from '../types';

type ProfileView = 'menu' | 'identity' | 'security' | 'kyc' | 'notifications' | 'support';

const BackHeader = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) => (
  <header className="px-4 py-6 border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-zinc-800 rounded-full transition-colors">
        <ArrowLeft size={24} />
      </button>
      <div>
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">{subtitle || 'Profile'}</p>
        <h2 className="text-xl font-black text-white tracking-tight leading-none">{title}</h2>
      </div>
    </div>
  </header>
);

function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const { user, fetchProfile, updateProfile, logout } = useMarket();
  const [activeView, setActiveView] = useState<ProfileView>('menu');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [notificationEmailAlerts, setNotificationEmailAlerts] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordsMismatch = newPassword !== '' && confirmPassword !== '' && newPassword !== confirmPassword;
  const [kycAddress, setKycAddress] = useState('');
  const [kycCity, setKycCity] = useState('');
  const [kycCountry, setKycCountry] = useState('');
  const [kycDocumentType, setKycDocumentType] = useState<KycDocumentType>('drivers_license');
  const [kycDocumentFile, setKycDocumentFile] = useState<File | null>(null);
  const [kycOtp, setKycOtp] = useState('');
  const [isSendingKycOtp, setIsSendingKycOtp] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [isConfirmingKycOtp, setIsConfirmingKycOtp] = useState(false);
  const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(null);

  const syncFormState = (input: ProfileData) => {
    setName(input.name ?? '');
    setPhone(input.phone ?? '');
    setTimezone(input.timezone ?? 'America/New_York');
    setNotificationEmailAlerts(Boolean(input.notificationEmailAlerts));
    setKycAddress(input.kycSubmission?.address ?? '');
    setKycCity(input.kycSubmission?.city ?? '');
    setKycCountry(input.kycSubmission?.country ?? input.country ?? '');
    setKycDocumentType((input.kycSubmission?.documentType ?? 'drivers_license') as KycDocumentType);
  };

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      setError(null);
      setSuccess(null);

      try {
        const payload = await fetchProfile();
        if (!isActive) {
          return;
        }
        setProfile(payload);
        syncFormState(payload);
      } catch (exception) {
        if (!isActive) {
          return;
        }
        const message = exception instanceof Error ? exception.message : 'Failed to load profile.';
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((previous) => previous ? { ...previous, ...user } : previous);
  }, [user]);

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      try {
        const settings = await apiPublicSettings();
        if (isActive) {
          setPublicSettings(settings);
        }
      } catch {
        if (isActive) {
          setPublicSettings(null);
        }
      }
    };

    void loadSettings();

    return () => {
      isActive = false;
    };
  }, []);

  const displayName = profile?.name ?? user?.name ?? 'User';
  const displayEmail = profile?.email ?? user?.email ?? '';
  const initials = useMemo(() => {
    const first = displayName.trim().charAt(0).toUpperCase();
    return first || 'U';
  }, [displayName]);

  const handleBack = () => {
    setError(null);
    setSuccess(null);
    setActiveView('menu');
  };

  const handleIdentitySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSavingIdentity(true);

    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        timezone: timezone.trim() || null,
      });
      setProfile(updated);
      syncFormState(updated);
      setSuccess('Profile updated successfully.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to update profile.';
      setError(message);
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSavingSecurity(true);

    try {
      await updateProfile({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to update password.';
      setError(message);
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleSendKycOtp = async () => {
    setError(null);
    setSuccess(null);
    setIsSendingKycOtp(true);

    try {
      await apiSendKycOtp();
      setSuccess('A KYC verification OTP has been sent to your email.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to send verification OTP.';
      setError(message);
    } finally {
      setIsSendingKycOtp(false);
    }
  };

  const handleKycSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!kycAddress.trim() || !kycCity.trim() || !kycCountry.trim()) {
      setError('Address, city, and country are required for KYC.');
      return;
    }

    if (!kycDocumentFile) {
      setError('Please upload your identity document.');
      return;
    }

    setIsSubmittingKyc(true);

    try {
      const updated = await apiSubmitKyc({
        address: kycAddress.trim(),
        city: kycCity.trim(),
        country: kycCountry.trim(),
        documentType: kycDocumentType,
        documentFile: kycDocumentFile,
      });

      setProfile(updated);
      syncFormState(updated);
      setKycDocumentFile(null);
      setSuccess('KYC details saved. Enter the OTP sent to your email to complete your submission.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to submit KYC details.';
      setError(message);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleKycOtpConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(kycOtp)) {
      setError('Enter the 6-digit OTP sent to your email.');
      return;
    }

    setIsConfirmingKycOtp(true);

    try {
      const updated = await apiConfirmKycOtp({
        otp: kycOtp.trim(),
      });
      setProfile(updated);
      syncFormState(updated);
      setKycOtp('');
      setSuccess('KYC submitted successfully. Admin review is pending.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to confirm KYC OTP.';
      setError(message);
    } finally {
      setIsConfirmingKycOtp(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationEmailAlerts(value);
    setError(null);
    setSuccess(null);
    setIsSavingNotifications(true);

    try {
      const updated = await updateProfile({
        notificationEmailAlerts: value,
      });
      setProfile(updated);
      syncFormState(updated);
      setSuccess('Notification settings updated.');
    } catch (exception) {
      setNotificationEmailAlerts((previous) => !previous);
      const message = exception instanceof Error ? exception.message : 'Failed to update notifications.';
      setError(message);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');

    if (section === 'kyc') {
      setActiveView('kyc');
    }
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="px-6 py-16 flex items-center justify-center">
        <Loader2 className="text-emerald-500 animate-spin" size={28} />
      </div>
    );
  }

  if (activeView === 'identity') {
    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="Personal information" subtitle="Identity" onBack={handleBack} />
        <form onSubmit={(event) => void handleIdentitySubmit(event)} className="p-4 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-bold text-emerald-300">{success}</div>}

          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Keep your profile synced with your trading account and security preferences.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                value={displayEmail}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-zinc-400 cursor-not-allowed"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingIdentity}
            className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:opacity-60 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all shadow-xl mt-4"
          >
            {isSavingIdentity ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    );
  }

  if (activeView === 'security') {
    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="Password & protection" subtitle="Security" onBack={handleBack} />
        <form onSubmit={(event) => void handlePasswordSubmit(event)} className="p-4 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-bold text-emerald-300">{success}</div>}

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4">
            <Shield className="text-emerald-500 shrink-0" size={20} />
            <p className="text-sm font-bold text-zinc-300">Two-factor authentication is not enabled for this account yet.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
              {passwordsMismatch && (
                <p className="text-[11px] font-bold text-red-400">Passwords do not match.</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingSecurity}
            className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:opacity-60 text-black font-black rounded-xl uppercase tracking-widest text-sm shadow-xl"
          >
            {isSavingSecurity ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    );
  }

  if (activeView === 'kyc') {
    const kycStatus = String(profile?.kycStatus ?? user?.kycStatus ?? 'pending').toLowerCase();
    const kycSubmissionStatus = String(profile?.kycSubmission?.status ?? '').toLowerCase();
    const isVerified = kycStatus === 'verified';
    const isAwaitingOtp = kycSubmissionStatus === 'awaiting_otp';
    const isUnderReview = kycSubmissionStatus === 'pending';
    const statusTone = isVerified
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
      : isAwaitingOtp
        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
      : kycStatus === 'rejected'
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-200';
    const documentTypeLabels: Record<KycDocumentType, string> = {
      drivers_license: 'Driver License',
      international_passport: 'International Passport',
      national_id_card: 'National ID Card',
    };
    const resolvedDocumentType = (profile?.kycSubmission?.documentType ?? kycDocumentType) as KycDocumentType;
    const statusLabel = isAwaitingOtp
      ? 'Awaiting OTP Confirmation'
      : isUnderReview
        ? 'Pending Admin Review'
        : formatStatus(profile?.kycStatus ?? user?.kycStatus);
    const isKycFormLocked = isVerified || isUnderReview;

    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="KYC Verification" subtitle="KYC" onBack={handleBack} />
        <div className="p-4 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-bold text-emerald-300">{success}</div>}

          <div className={`rounded-2xl border p-5 ${statusTone}`}>
            <p className="text-[10px] font-black uppercase tracking-widest">Current Status</p>
            <p className="mt-2 text-sm font-black">KYC Status: {statusLabel}</p>
            {profile?.kycSubmission?.reviewNotes ? (
              <p className="mt-2 text-xs font-medium opacity-90">Admin note: {profile.kycSubmission.reviewNotes}</p>
            ) : null}
          </div>

          {isAwaitingOtp ? (
            <>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
                <h4 className="text-base font-black text-white">KYC Details Received</h4>
                <p className="text-xs text-zinc-500 font-bold">
                  We saved your KYC details. Confirm with the OTP sent to your email to send this to admin for review.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 text-sm text-zinc-300">
                  <p><span className="text-zinc-500">Address:</span> {profile?.kycSubmission?.address || '-'}</p>
                  <p><span className="text-zinc-500">City:</span> {profile?.kycSubmission?.city || '-'}</p>
                  <p><span className="text-zinc-500">Country:</span> {profile?.kycSubmission?.country || '-'}</p>
                  <p><span className="text-zinc-500">Document:</span> {documentTypeLabels[resolvedDocumentType]}</p>
                </div>
              </div>

              <form onSubmit={(event) => void handleKycOtpConfirm(event)} className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black text-white">Second OTP Verification</h4>
                    <p className="text-xs text-zinc-500 font-bold mt-1">Enter the OTP from your email to finalize KYC submission.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSendKycOtp()}
                    disabled={isSendingKycOtp || isVerified}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-300 disabled:opacity-50"
                  >
                    {isSendingKycOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">KYC OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={kycOtp}
                    onChange={(event) => setKycOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isVerified}
                    className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-sm font-black tracking-[0.35em] text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConfirmingKycOtp || isVerified}
                  className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:opacity-60 text-black font-black rounded-xl uppercase tracking-widest text-sm shadow-xl"
                >
                  {isVerified ? 'Already Verified' : isConfirmingKycOtp ? 'Confirming...' : 'Confirm OTP & Submit KYC'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={(event) => void handleKycSubmit(event)} className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
              <h4 className="text-base font-black text-white">KYC Details</h4>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Address</label>
                <input
                  type="text"
                  value={kycAddress}
                  onChange={(event) => setKycAddress(event.target.value)}
                  disabled={isKycFormLocked}
                  className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
                  placeholder="Street address"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">City</label>
                  <input
                    type="text"
                    value={kycCity}
                    onChange={(event) => setKycCity(event.target.value)}
                    disabled={isKycFormLocked}
                    className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Country</label>
                  <input
                    type="text"
                    value={kycCountry}
                    onChange={(event) => setKycCountry(event.target.value)}
                    disabled={isKycFormLocked}
                    className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Document Type</label>
                <select
                  value={kycDocumentType}
                  onChange={(event) => setKycDocumentType(event.target.value as KycDocumentType)}
                  disabled={isKycFormLocked}
                  className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
                >
                  <option value="drivers_license">Driver License</option>
                  <option value="international_passport">International Passport</option>
                  <option value="national_id_card">National ID Card</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Upload Document</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(event) => setKycDocumentFile(event.target.files?.[0] ?? null)}
                  disabled={isKycFormLocked}
                  className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-2 file:text-xs file:font-black file:text-emerald-300 disabled:opacity-60"
                />
                {profile?.kycSubmission?.id && !kycDocumentFile ? (
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Existing document: {documentTypeLabels[resolvedDocumentType]}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmittingKyc || isKycFormLocked}
                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:opacity-60 text-black font-black rounded-xl uppercase tracking-widest text-sm shadow-xl"
              >
                {isVerified
                  ? 'Already Verified'
                  : isUnderReview
                    ? 'Pending Admin Review'
                    : isSubmittingKyc
                      ? 'Submitting...'
                      : 'Continue To OTP Verification'}
              </button>
            </form>
          )}

          {!isVerified && !isUnderReview && !isAwaitingOtp && (
            <p className="text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              After you submit these details, we email you a second OTP. Enter that OTP to send your KYC to admin for review.
            </p>
          )}
          {isUnderReview && (
            <p className="text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              Your KYC submission is currently under admin review.
            </p>
          )}
          {profile?.kycSubmission?.submittedAt ? (
            <p className="text-[11px] text-zinc-500 font-medium">
              Last submitted: {new Date(profile.kycSubmission.submittedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeView === 'notifications') {
    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="Stay in the loop" subtitle="Notifications" onBack={handleBack} />
        <div className="p-4 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-bold text-emerald-300">{success}</div>}

          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-white">Email alerts</h4>
              <p className="text-xs text-zinc-500 font-bold">Approvals and account changes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationEmailAlerts}
                onChange={(event) => {
                  void handleNotificationToggle(event.target.checked);
                }}
                className="sr-only peer"
                disabled={isSavingNotifications}
              />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'support') {
    const supportEmail = publicSettings?.supportEmail || 'support@runwayalgo.com';

    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="Support & live chat" subtitle="Support" onBack={handleBack} />
        <div className="p-4 space-y-6">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h4 className="text-base font-black text-white">Contact Support</h4>
            <p className="text-xs text-zinc-500 font-bold mt-2">
              Reach our support desk for verification, security, or funding help.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex mt-4 text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
            >
              {supportEmail}
            </a>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h4 className="text-base font-black text-white">Live Chat</h4>
            <p className="text-xs text-zinc-500 font-bold mt-2">
              Chat with our team directly if live chat is enabled.
            </p>
            {publicSettings?.livechatEnabled && publicSettings.livechatEmbedCode ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <LiveChatEmbed
                  enabled={publicSettings.livechatEnabled}
                  embedCode={publicSettings.livechatEmbedCode}
                  className="text-white"
                />
              </div>
            ) : (
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                Live chat is currently offline.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="p-6 pb-2">
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Profile</p>
        <h2 className="text-3xl font-black text-white tracking-tight">Account preferences</h2>
      </header>

      <div className="px-6 space-y-8">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-bold text-emerald-300">{success}</div>}

        <div className="flex flex-col items-center py-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-emerald-500/20 flex items-center justify-center text-4xl font-black text-white">
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#050505] text-black">
              <Camera size={14} strokeWidth={3} />
            </button>
          </div>
          <h3 className="text-2xl font-black text-white">{displayName}</h3>
          <p className="text-sm text-zinc-500 font-bold mb-3">{displayEmail}</p>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 rounded-full flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatStatus(profile?.membershipTier ?? user?.membershipTier)} Member</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Settings</h4>
          <div className="grid gap-3">
            <button onClick={() => setActiveView('identity')} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <User size={18} className="text-emerald-500" />
                <span className="text-sm font-black text-white">Personal Information</span>
              </div>
              <ChevronRight size={18} className="text-zinc-700" />
            </button>
            <button onClick={() => setActiveView('security')} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Lock size={18} className="text-orange-500" />
                <span className="text-sm font-black text-white">Security & Password</span>
              </div>
              <ChevronRight size={18} className="text-zinc-700" />
            </button>
            <button onClick={() => setActiveView('kyc')} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserCheck size={18} className="text-blue-500" />
                <span className="text-sm font-black text-white">KYC Verification</span>
              </div>
              <ChevronRight size={18} className="text-zinc-700" />
            </button>
            <button onClick={() => setActiveView('notifications')} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield size={18} className="text-emerald-500" />
                <span className="text-sm font-black text-white">Notifications</span>
              </div>
              <ChevronRight size={18} className="text-zinc-700" />
            </button>
            <button onClick={() => setActiveView('support')} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageCircle size={18} className="text-emerald-500" />
                <span className="text-sm font-black text-white">Support & Live Chat</span>
              </div>
              <ChevronRight size={18} className="text-zinc-700" />
            </button>
          </div>
        </div>

        <button
          onClick={() => void handleSignOut()}
          disabled={isLoggingOut}
          className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-black rounded-2xl uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 mt-6 disabled:opacity-60"
        >
          {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
