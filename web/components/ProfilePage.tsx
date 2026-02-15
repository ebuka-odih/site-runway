import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  User,
  Shield,
  CheckCircle,
  ChevronRight,
  LogOut,
  Lock,
  UserCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { ProfileData } from '../types';

type ProfileView = 'menu' | 'identity' | 'security' | 'kyc' | 'notifications';

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

  const syncFormState = (input: ProfileData) => {
    setName(input.name ?? '');
    setPhone(input.phone ?? '');
    setTimezone(input.timezone ?? 'America/New_York');
    setNotificationEmailAlerts(Boolean(input.notificationEmailAlerts));
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

    setIsSavingSecurity(true);

    try {
      await updateProfile({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Password updated successfully.');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to update password.';
      setError(message);
    } finally {
      setIsSavingSecurity(false);
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
    const isVerified = (profile?.kycStatus ?? user?.kycStatus ?? 'pending') === 'verified';

    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        <BackHeader title="Verification overview" subtitle="KYC" onBack={handleBack} />
        <div className="p-4 space-y-6">
          <div className="bg-[#0c1a12] border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
            <CheckCircle className="text-emerald-500" size={24} />
            <p className="text-sm font-black text-white">KYC Status: {formatStatus(profile?.kycStatus ?? user?.kycStatus)}</p>
          </div>
          <div className="space-y-4">
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
              <h4 className="text-lg font-black text-white">Identity Verification</h4>
              <div className={`flex items-center gap-1.5 mt-1 ${isVerified ? 'text-emerald-500' : 'text-yellow-500'}`}>
                <CheckCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isVerified ? 'Verified' : 'In Review'}</span>
              </div>
            </div>
          </div>
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
