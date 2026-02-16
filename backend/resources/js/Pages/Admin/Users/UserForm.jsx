import { Link } from '@inertiajs/react';

export default function UserForm({
    form,
    options,
    heading,
    description,
    submitLabel,
    onSubmit,
    cancelHref = '/admin/users',
    showPasswordHelp = false,
}) {
    return (
        <div className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-100">{heading}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Username" error={form.errors.username} required>
                        <input
                            type="text"
                            value={form.data.username}
                            onChange={(event) => form.setData('username', event.target.value)}
                            className={fieldClass(form.errors.username)}
                            autoComplete="off"
                            required
                        />
                    </Field>

                    <Field label="Full Name" error={form.errors.name} required>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            className={fieldClass(form.errors.name)}
                            autoComplete="name"
                            required
                        />
                    </Field>

                    <Field label="Email" error={form.errors.email} required>
                        <input
                            type="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                            className={fieldClass(form.errors.email)}
                            autoComplete="email"
                            required
                        />
                    </Field>

                    <Field label="Phone" error={form.errors.phone}>
                        <input
                            type="text"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                            className={fieldClass(form.errors.phone)}
                            autoComplete="tel"
                        />
                    </Field>

                    <Field label="Country" error={form.errors.country}>
                        <select
                            value={form.data.country}
                            onChange={(event) => form.setData('country', event.target.value)}
                            className={fieldClass(form.errors.country)}
                        >
                            <option value="">Select country</option>
                            {options.countries.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Timezone" error={form.errors.timezone}>
                        <input
                            type="text"
                            value={form.data.timezone}
                            onChange={(event) => form.setData('timezone', event.target.value)}
                            className={fieldClass(form.errors.timezone)}
                            placeholder="America/New_York"
                        />
                    </Field>

                    <Field label="Membership Tier" error={form.errors.membership_tier} required>
                        <select
                            value={form.data.membership_tier}
                            onChange={(event) => form.setData('membership_tier', event.target.value)}
                            className={fieldClass(form.errors.membership_tier)}
                            required
                        >
                            {options.membership_tiers.map((tier) => (
                                <option key={tier} value={tier}>
                                    {tier}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="KYC Status" error={form.errors.kyc_status} required>
                        <select
                            value={form.data.kyc_status}
                            onChange={(event) => form.setData('kyc_status', event.target.value)}
                            className={fieldClass(form.errors.kyc_status)}
                            required
                        >
                            {options.kyc_statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Password" error={form.errors.password} required={!showPasswordHelp}>
                        <input
                            type="password"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            className={fieldClass(form.errors.password)}
                            autoComplete="new-password"
                            required={!showPasswordHelp}
                        />
                    </Field>

                    <Field
                        label="Confirm Password"
                        error={form.errors.password_confirmation}
                        required={!showPasswordHelp}
                    >
                        <input
                            type="password"
                            value={form.data.password_confirmation}
                            onChange={(event) => form.setData('password_confirmation', event.target.value)}
                            className={fieldClass(form.errors.password_confirmation)}
                            autoComplete="new-password"
                            required={!showPasswordHelp}
                        />
                    </Field>
                </div>

                {showPasswordHelp && (
                    <p className="text-xs text-slate-500">
                        Leave password fields empty to keep the current password unchanged.
                    </p>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                    <Toggle
                        label="Admin Access"
                        checked={form.data.is_admin}
                        onChange={(value) => form.setData('is_admin', value)}
                    />
                    <Toggle
                        label="Email Verified"
                        checked={form.data.email_verified}
                        onChange={(value) => form.setData('email_verified', value)}
                    />
                    <Toggle
                        label="Email Alerts"
                        checked={form.data.notification_email_alerts}
                        onChange={(value) => form.setData('notification_email_alerts', value)}
                    />
                </div>

                {(form.errors.is_admin || form.errors.email_verified || form.errors.notification_email_alerts) && (
                    <p className="text-xs text-rose-300">
                        {form.errors.is_admin || form.errors.email_verified || form.errors.notification_email_alerts}
                    </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {form.processing ? 'Saving...' : submitLabel}
                    </button>

                    <Link
                        href={cancelHref}
                        className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

function Field({ label, error, children, required = false }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm text-slate-300">
                {label} {required ? <span className="text-rose-300">*</span> : null}
            </span>
            {children}
            {error && <span className="mt-1 block text-xs text-rose-300">{error}</span>}
        </label>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <span>{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 rounded-full transition ${
                    checked ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
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

const fieldClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        hasError
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
