import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';

export default function Index({ settings }) {
    const form = useForm({
        site_mode: settings.site_mode,
        deposits_enabled: Boolean(settings.deposits_enabled),
        withdrawals_enabled: Boolean(settings.withdrawals_enabled),
        require_kyc_for_withdrawals: Boolean(settings.require_kyc_for_withdrawals),
        session_timeout_minutes: Number(settings.session_timeout_minutes),
        support_email: settings.support_email,
        livechat_enabled: Boolean(settings.livechat_enabled),
        livechat_provider: settings.livechat_provider || '',
        livechat_embed_code: settings.livechat_embed_code || '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post('/admin/settings');
    };

    return (
        <AdminLayout title="Settings">
            <section className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Platform Controls</h3>
                <p className="mt-1 text-sm text-slate-400">
                    These settings are stored by the backend and applied to admin operations.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
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
                            label="Require KYC on Withdrawals"
                            checked={form.data.require_kyc_for_withdrawals}
                            onChange={(value) => form.setData('require_kyc_for_withdrawals', value)}
                        />
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

                    {(form.errors.deposits_enabled ||
                        form.errors.withdrawals_enabled ||
                        form.errors.require_kyc_for_withdrawals ||
                        form.errors.livechat_enabled) && (
                        <p className="text-xs text-rose-300">
                            {form.errors.deposits_enabled ||
                                form.errors.withdrawals_enabled ||
                                form.errors.require_kyc_for_withdrawals ||
                                form.errors.livechat_enabled}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {form.processing ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </section>

            <section className="mt-6 max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Database Export</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Export the full site database (all tables and rows) to a local NDJSON snapshot for backup or audit use.
                </p>

                <div className="mt-4">
                    <a
                        href="/admin/settings/export/database"
                        className="inline-flex rounded-xl border border-cyan-500/60 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                        Export Full Site Database
                    </a>
                </div>
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
