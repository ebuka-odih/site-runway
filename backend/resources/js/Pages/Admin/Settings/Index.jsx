import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ settings }) {
    const { url, props } = usePage();
    const authUser = props?.auth?.user;
    const [activeTab, setActiveTab] = useState('site');
    const form = useForm({
        brand_name: settings.brand_name || 'PrologezPrime',
        site_mode: settings.site_mode,
        deposits_enabled: Boolean(settings.deposits_enabled),
        withdrawals_enabled: Boolean(settings.withdrawals_enabled),
        require_kyc_for_deposits: Boolean(settings.require_kyc_for_deposits),
        require_kyc_for_withdrawals: Boolean(settings.require_kyc_for_withdrawals),
        session_timeout_minutes: Number(settings.session_timeout_minutes),
        support_email: settings.support_email,
        livechat_enabled: Boolean(settings.livechat_enabled),
        livechat_provider: settings.livechat_provider || '',
        livechat_embed_code: settings.livechat_embed_code || '',
    });
    const securityForm = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const profileForm = useForm({
        name: authUser?.name || '',
        email: authUser?.email || '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(adminPath(url, 'settings'));
    };

    const submitSecurity = (event) => {
        event.preventDefault();
        securityForm.post(adminPath(url, 'settings/security'), {
            preserveScroll: true,
            onSuccess: () => {
                securityForm.reset();
            },
        });
    };

    const submitProfile = (event) => {
        event.preventDefault();
        profileForm.post(adminPath(url, 'settings/profile'), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Settings">
            <section className="max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Admin Settings</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Manage site controls, security, and support tooling from one place.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                    {[
                        { key: 'site', label: 'Site Controls' },
                        { key: 'livechat', label: 'Live Chat' },
                        { key: 'profile', label: 'Admin Profile' },
                        { key: 'security', label: 'Security' },
                        { key: 'exports', label: 'Exports' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                                activeTab === tab.key
                                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-100'
                                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'site' && (
                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Brand Name</span>
                                <input
                                    type="text"
                                    value={form.data.brand_name}
                                    onChange={(event) => form.setData('brand_name', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                    required
                                />
                                {form.errors.brand_name && (
                                    <span className="mt-1 block text-xs text-rose-300">{form.errors.brand_name}</span>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Site Mode</span>
                                <select
                                    value={form.data.site_mode}
                                    onChange={(event) => form.setData('site_mode', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                >
                                    <option value="live">Live</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                                {form.errors.site_mode && (
                                    <span className="mt-1 block text-xs text-rose-300">{form.errors.site_mode}</span>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Support Email</span>
                                <input
                                    type="email"
                                    value={form.data.support_email}
                                    onChange={(event) => form.setData('support_email', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                    required
                                />
                                {form.errors.support_email && (
                                    <span className="mt-1 block text-xs text-rose-300">{form.errors.support_email}</span>
                                )}
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Session Timeout (minutes)</span>
                            <input
                                type="number"
                                min="5"
                                max="240"
                                value={form.data.session_timeout_minutes}
                                onChange={(event) => form.setData('session_timeout_minutes', Number(event.target.value))}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {form.errors.session_timeout_minutes && (
                                <span className="mt-1 block text-xs text-rose-300">
                                    {form.errors.session_timeout_minutes}
                                </span>
                            )}
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Toggle
                                label="Enable Deposits"
                                checked={form.data.deposits_enabled}
                                onChange={(value) => form.setData('deposits_enabled', value)}
                            />
                            <Toggle
                                label="Enable Withdrawals"
                                checked={form.data.withdrawals_enabled}
                                onChange={(value) => form.setData('withdrawals_enabled', value)}
                            />
                            <Toggle
                                label="Require KYC on Deposits"
                                checked={form.data.require_kyc_for_deposits}
                                onChange={(value) => form.setData('require_kyc_for_deposits', value)}
                            />
                            <Toggle
                                label="Require KYC on Withdrawals"
                                checked={form.data.require_kyc_for_withdrawals}
                                onChange={(value) => form.setData('require_kyc_for_withdrawals', value)}
                            />
                        </div>

                        {(form.errors.deposits_enabled ||
                            form.errors.withdrawals_enabled ||
                            form.errors.require_kyc_for_deposits ||
                            form.errors.require_kyc_for_withdrawals) && (
                            <p className="text-xs text-rose-300">
                                {form.errors.deposits_enabled ||
                                    form.errors.withdrawals_enabled ||
                                    form.errors.require_kyc_for_deposits ||
                                    form.errors.require_kyc_for_withdrawals}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Saving...' : 'Save Site Settings'}
                        </button>
                    </form>
                )}

                {activeTab === 'livechat' && (
                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <p className="text-xs text-slate-500">
                            Livechat embeds appear on the public landing page and inside the user dashboard support view.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Toggle
                                label="Enable Livechat"
                                checked={form.data.livechat_enabled}
                                onChange={(value) => form.setData('livechat_enabled', value)}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Livechat Provider</span>
                                <input
                                    type="text"
                                    value={form.data.livechat_provider}
                                    onChange={(event) => form.setData('livechat_provider', event.target.value)}
                                    placeholder="tawk.to, intercom, crisp"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                />
                                {form.errors.livechat_provider && (
                                    <span className="mt-1 block text-xs text-rose-300">{form.errors.livechat_provider}</span>
                                )}
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Livechat Embed Code</span>
                            <textarea
                                value={form.data.livechat_embed_code}
                                onChange={(event) => form.setData('livechat_embed_code', event.target.value)}
                                placeholder="Paste your livechat script or HTML embed code here"
                                rows={8}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none transition focus:border-cyan-400"
                            />
                            {form.errors.livechat_embed_code && (
                                <span className="mt-1 block text-xs text-rose-300">{form.errors.livechat_embed_code}</span>
                            )}
                        </label>

                        {form.errors.livechat_enabled && (
                            <p className="text-xs text-rose-300">{form.errors.livechat_enabled}</p>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Saving...' : 'Save Livechat Settings'}
                        </button>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={submitSecurity} className="mt-6 space-y-5 max-w-xl">
                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Current Password</span>
                            <input
                                type="password"
                                value={securityForm.data.current_password}
                                onChange={(event) => securityForm.setData('current_password', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {securityForm.errors.current_password && (
                                <span className="mt-1 block text-xs text-rose-300">{securityForm.errors.current_password}</span>
                            )}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">New Password</span>
                            <input
                                type="password"
                                value={securityForm.data.new_password}
                                onChange={(event) => securityForm.setData('new_password', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {securityForm.errors.new_password && (
                                <span className="mt-1 block text-xs text-rose-300">{securityForm.errors.new_password}</span>
                            )}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Confirm New Password</span>
                            <input
                                type="password"
                                value={securityForm.data.new_password_confirmation}
                                onChange={(event) => securityForm.setData('new_password_confirmation', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {securityForm.errors.new_password_confirmation && (
                                <span className="mt-1 block text-xs text-rose-300">
                                    {securityForm.errors.new_password_confirmation}
                                </span>
                            )}
                        </label>

                        <button
                            type="submit"
                            disabled={securityForm.processing}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {securityForm.processing ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {activeTab === 'profile' && (
                    <form onSubmit={submitProfile} className="mt-6 space-y-5 max-w-xl">
                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Admin Name</span>
                            <input
                                type="text"
                                value={profileForm.data.name}
                                onChange={(event) => profileForm.setData('name', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {profileForm.errors.name && (
                                <span className="mt-1 block text-xs text-rose-300">{profileForm.errors.name}</span>
                            )}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Admin Email</span>
                            <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(event) => profileForm.setData('email', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                required
                            />
                            {profileForm.errors.email && (
                                <span className="mt-1 block text-xs text-rose-300">{profileForm.errors.email}</span>
                            )}
                        </label>

                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {profileForm.processing ? 'Updating...' : 'Save Admin Profile'}
                        </button>
                    </form>
                )}

                {activeTab === 'exports' && (
                    <div className="mt-6 max-w-3xl">
                        <h3 className="text-base font-semibold text-slate-100">Database Export</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Export the full site database (all tables and rows) to a local NDJSON snapshot for backup or audit use.
                        </p>

                        <div className="mt-4">
                            <a
                                href={adminPath(url, 'settings/export/database')}
                                className="inline-flex rounded-xl border border-cyan-500/60 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                            >
                                Export Full Site Database
                            </a>
                        </div>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <span>{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
                <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        checked ? 'left-5' : 'left-0.5'
                    }`}
                />
            </button>
        </label>
    );
}
