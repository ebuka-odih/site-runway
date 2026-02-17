import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, useForm, usePage } from '@inertiajs/react';

const toLocalInputValue = (value) => {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    const pad = (number) => String(number).padStart(2, '0');

    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(
        parsed.getMinutes(),
    )}`;
};

export default function Create() {
    const { url } = usePage();
    const form = useForm({
        display_name: '',
        username: '',
        avatar_color: '',
        strategy: '',
        copy_fee: 0,
        total_return: 0,
        win_rate: 0,
        copiers_count: 0,
        risk_score: 5,
        joined_at: toLocalInputValue(new Date().toISOString()),
        is_verified: false,
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(adminPath(url, 'copy-traders'));
    };

    return (
        <AdminLayout title="Create Copy Trader">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">Create Copy Trader</h2>
                        <p className="mt-1 text-sm text-slate-400">Add a new copy trader profile and fee.</p>
                    </div>
                    <Link
                        href={adminPath(url, 'copy-traders')}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                        Back to list
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Display Name" error={form.errors.display_name} required>
                            <input
                                type="text"
                                value={form.data.display_name}
                                onChange={(event) => form.setData('display_name', event.target.value)}
                                className={fieldClass(form.errors.display_name)}
                                required
                            />
                        </Field>

                        <Field label="Username" error={form.errors.username} required>
                            <input
                                type="text"
                                value={form.data.username}
                                onChange={(event) => form.setData('username', event.target.value)}
                                className={fieldClass(form.errors.username)}
                                required
                            />
                        </Field>

                        <Field label="Avatar Color" error={form.errors.avatar_color}>
                            <input
                                type="text"
                                value={form.data.avatar_color}
                                onChange={(event) => form.setData('avatar_color', event.target.value)}
                                className={fieldClass(form.errors.avatar_color)}
                                placeholder="emerald"
                            />
                        </Field>

                        <Field label="Strategy" error={form.errors.strategy} required>
                            <input
                                type="text"
                                value={form.data.strategy}
                                onChange={(event) => form.setData('strategy', event.target.value)}
                                className={fieldClass(form.errors.strategy)}
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Copy Fee ($)" error={form.errors.copy_fee} required>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.copy_fee}
                                onChange={(event) => form.setData('copy_fee', event.target.value)}
                                className={fieldClass(form.errors.copy_fee)}
                                required
                            />
                        </Field>

                        <Field label="Total Return (%)" error={form.errors.total_return} required>
                            <input
                                type="number"
                                step="0.01"
                                value={form.data.total_return}
                                onChange={(event) => form.setData('total_return', event.target.value)}
                                className={fieldClass(form.errors.total_return)}
                                required
                            />
                        </Field>

                        <Field label="Win Rate (%)" error={form.errors.win_rate} required>
                            <input
                                type="number"
                                step="0.01"
                                value={form.data.win_rate}
                                onChange={(event) => form.setData('win_rate', event.target.value)}
                                className={fieldClass(form.errors.win_rate)}
                                required
                            />
                        </Field>

                        <Field label="Copiers Count" error={form.errors.copiers_count} required>
                            <input
                                type="number"
                                step="1"
                                value={form.data.copiers_count}
                                onChange={(event) => form.setData('copiers_count', event.target.value)}
                                className={fieldClass(form.errors.copiers_count)}
                                required
                            />
                        </Field>

                        <Field label="Risk Score (1-10)" error={form.errors.risk_score} required>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                max="10"
                                value={form.data.risk_score}
                                onChange={(event) => form.setData('risk_score', event.target.value)}
                                className={fieldClass(form.errors.risk_score)}
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Joined At" error={form.errors.joined_at} required>
                            <input
                                type="datetime-local"
                                value={form.data.joined_at}
                                onChange={(event) => form.setData('joined_at', event.target.value)}
                                className={fieldClass(form.errors.joined_at)}
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Toggle
                            label="Verified"
                            checked={form.data.is_verified}
                            onChange={(value) => form.setData('is_verified', value)}
                        />
                        <Toggle
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(value) => form.setData('is_active', value)}
                        />
                    </div>

                    {(form.errors.is_verified || form.errors.is_active) && (
                        <p className="text-xs text-rose-300">{form.errors.is_verified || form.errors.is_active}</p>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Saving...' : 'Create Trader'}
                        </button>

                        <Link
                            href={adminPath(url, 'copy-traders')}
                            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </section>
        </AdminLayout>
    );
}

function Field({ label, error, required, children }) {
    return (
        <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label} {required ? <span className="text-rose-300">*</span> : null}
            </span>
            {children}
            {error ? <span className="text-xs text-rose-300">{error}</span> : null}
        </label>
    );
}

function fieldClass(error) {
    return `rounded-xl border px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 ${
        error ? 'border-rose-400 bg-rose-500/10' : 'border-slate-700 bg-slate-950'
    }`;
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200">
            <span className="font-medium">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                    checked ? 'bg-emerald-500/70' : 'bg-slate-700'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        checked ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
            </button>
        </label>
    );
}
