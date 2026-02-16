import { adminPath } from '@/lib/adminPath';
import { Link, usePage } from '@inertiajs/react';

export default function PaymentMethodForm({
    form,
    options,
    heading,
    description,
    submitLabel,
    onSubmit,
    cancelHref,
}) {
    const { url } = usePage();
    const cancelUrl = cancelHref || adminPath(url, 'payment-methods');
    const isCrypto = form.data.channel === 'crypto';

    return (
        <section className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-100">{heading}</h3>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Method Name" error={form.errors.name} required>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            className={inputClass(form.errors.name)}
                            required
                        />
                    </Field>

                    <Field label="Channel" error={form.errors.channel} required>
                        <select
                            value={form.data.channel}
                            onChange={(event) => {
                                const nextChannel = event.target.value;
                                form.setData('channel', nextChannel);

                                if (nextChannel !== 'crypto') {
                                    form.setData('wallet_address', '');
                                }
                            }}
                            className={inputClass(form.errors.channel)}
                            required
                        >
                            {options.channels.map((channel) => (
                                <option key={channel} value={channel}>
                                    {channel}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Currency" error={form.errors.currency} required>
                        <input
                            type="text"
                            value={form.data.currency}
                            onChange={(event) => form.setData('currency', event.target.value.toUpperCase())}
                            className={inputClass(form.errors.currency)}
                            placeholder="USD / USDT / BTC"
                            required
                        />
                    </Field>

                    <Field label="Network" error={form.errors.network}>
                        <input
                            type="text"
                            value={form.data.network}
                            onChange={(event) => form.setData('network', event.target.value)}
                            className={inputClass(form.errors.network)}
                            placeholder="SWIFT / ERC20 / TRC20"
                        />
                    </Field>

                    {isCrypto && (
                        <Field label="Wallet Address" error={form.errors.wallet_address} required>
                            <input
                                type="text"
                                value={form.data.wallet_address}
                                onChange={(event) => form.setData('wallet_address', event.target.value)}
                                className={inputClass(form.errors.wallet_address)}
                                placeholder="0x... / T... / bc1..."
                                required
                            />
                        </Field>
                    )}

                    <Field label="Status" error={form.errors.status} required>
                        <select
                            value={form.data.status}
                            onChange={(event) => form.setData('status', event.target.value)}
                            className={inputClass(form.errors.status)}
                            required
                        >
                            {options.statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Display Order" error={form.errors.display_order}>
                        <input
                            type="number"
                            min="0"
                            value={form.data.display_order}
                            onChange={(event) => form.setData('display_order', Number(event.target.value))}
                            className={inputClass(form.errors.display_order)}
                        />
                    </Field>
                </div>

                <Field label="Description" error={form.errors.description}>
                    <textarea
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        rows={3}
                        className={inputClass(form.errors.description)}
                        placeholder="Optional note shown to admins."
                    />
                </Field>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {form.processing ? 'Saving...' : submitLabel}
                    </button>

                    <Link
                        href={cancelUrl}
                        className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </section>
    );
}

function Field({ label, error, required = false, children }) {
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

function inputClass(error) {
    return `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        error
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
}
