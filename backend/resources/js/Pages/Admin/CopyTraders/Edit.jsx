import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, router, useForm, usePage } from '@inertiajs/react';

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

export default function Edit({ trader, assets, active_followers, followers = [], trade_history = [] }) {
    const { url } = usePage();
    const form = useForm({
        display_name: trader.display_name || '',
        username: trader.username || '',
        avatar_color: trader.avatar_color || '',
        strategy: trader.strategy || '',
        copy_fee: trader.copy_fee ?? 0,
        total_return: trader.total_return ?? 0,
        win_rate: trader.win_rate ?? 0,
        copiers_count: trader.copiers_count ?? 0,
        risk_score: trader.risk_score ?? 1,
        joined_at: toLocalInputValue(trader.joined_at),
        is_verified: Boolean(trader.is_verified),
        is_active: Boolean(trader.is_active),
    });

    const firstAsset = assets?.[0] ?? null;
    const tradeForm = useForm({
        asset_id: firstAsset?.id || '',
        apply_to: 'all',
        copy_relationship_id: '',
        side: 'buy',
        quantity: '',
        price: firstAsset?.price ?? '',
        executed_at: '',
        pnl: '',
        note: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(adminPath(url, `copy-traders/${trader.id}`));
    };

    const handleDelete = () => {
        if (!window.confirm('Delete this copy trader? This will remove all related follower relationships.')) {
            return;
        }

        router.delete(adminPath(url, `copy-traders/${trader.id}`));
    };

    const submitTrade = (event) => {
        event.preventDefault();
        tradeForm.post(adminPath(url, `copy-traders/${trader.id}/trades`), {
            preserveScroll: true,
            onSuccess: () => {
                tradeForm.reset('quantity', 'pnl', 'note', 'executed_at');
            },
        });
    };

    const handleAssetChange = (value) => {
        tradeForm.setData('asset_id', value);
        const selected = assets.find((asset) => asset.id === value);
        if (selected) {
            tradeForm.setData('price', selected.price);
        }
    };

    const tradeHistory = Array.isArray(trade_history) ? trade_history : [];
    const followerOptions = Array.isArray(followers) ? followers : [];
    const isSingleScope = tradeForm.data.apply_to === 'single';
    const canSubmitAll = Number(active_followers || 0) > 0;
    const canSubmitSingle = Boolean(tradeForm.data.copy_relationship_id);
    const tradeSubmitDisabled = tradeForm.processing || (isSingleScope ? !canSubmitSingle : !canSubmitAll);

    const handleScopeChange = (scope) => {
        tradeForm.setData('apply_to', scope);
        if (scope !== 'single') {
            tradeForm.setData('copy_relationship_id', '');
        }
    };

    return (
        <AdminLayout title={`Edit ${trader.display_name}`}>
            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">Trader Details</h2>
                            <p className="mt-1 text-sm text-slate-400">Update copy trader stats and profile info.</p>
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
                                {form.processing ? 'Saving...' : 'Save Changes'}
                            </button>

                            <Link
                                href={adminPath(url, 'copy-traders')}
                                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                            >
                                Cancel
                            </Link>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-xl border border-rose-500/50 px-5 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/10"
                            >
                                Delete Trader
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-100">Execute Copy Trade</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {isSingleScope
                                ? 'Apply this trade history entry to one copied user.'
                                : `Applies the trade to ${active_followers} active follower${
                                      active_followers === 1 ? '' : 's'
                                  }.`}{' '}
                            Quantity and PnL scale by each follower&apos;s copy ratio.
                        </p>
                    </div>

                    <form onSubmit={submitTrade} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Apply To" error={tradeForm.errors.apply_to} required>
                                <select
                                    value={tradeForm.data.apply_to}
                                    onChange={(event) => handleScopeChange(event.target.value)}
                                    className={fieldClass(tradeForm.errors.apply_to)}
                                    required
                                >
                                    <option value="all">
                                        All active followers ({active_followers || 0})
                                    </option>
                                    <option value="single">One copied user</option>
                                </select>
                            </Field>

                            {isSingleScope ? (
                                <Field label="Copied User" error={tradeForm.errors.copy_relationship_id} required>
                                    <select
                                        value={tradeForm.data.copy_relationship_id}
                                        onChange={(event) => tradeForm.setData('copy_relationship_id', event.target.value)}
                                        className={fieldClass(tradeForm.errors.copy_relationship_id)}
                                        required
                                    >
                                        <option value="" disabled>
                                            Select copied user
                                        </option>
                                        {followerOptions.map((relationship) => {
                                            const name = relationship?.user?.name || relationship?.user?.email || 'Unknown';
                                            const status = String(relationship?.status || 'active');
                                            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                                            const ratio = Number(relationship?.copy_ratio || 0).toLocaleString(undefined, {
                                                maximumFractionDigits: 2,
                                            });

                                            return (
                                                <option key={relationship.id} value={relationship.id}>
                                                    {name} · {statusLabel} · {ratio}x
                                                </option>
                                            );
                                        })}
                                    </select>
                                </Field>
                            ) : null}
                        </div>

                        <Field label="Asset" error={tradeForm.errors.asset_id} required>
                            <select
                                value={tradeForm.data.asset_id}
                                onChange={(event) => handleAssetChange(event.target.value)}
                                className={fieldClass(tradeForm.errors.asset_id)}
                                required
                            >
                                <option value="" disabled>
                                    Select an asset
                                </option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.symbol} · {asset.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Side" error={tradeForm.errors.side} required>
                                <select
                                    value={tradeForm.data.side}
                                    onChange={(event) => tradeForm.setData('side', event.target.value)}
                                    className={fieldClass(tradeForm.errors.side)}
                                    required
                                >
                                    <option value="buy">Buy</option>
                                    <option value="sell">Sell</option>
                                </select>
                            </Field>

                            <Field label="Quantity (Leader)" error={tradeForm.errors.quantity} required>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    value={tradeForm.data.quantity}
                                    onChange={(event) => tradeForm.setData('quantity', event.target.value)}
                                    className={fieldClass(tradeForm.errors.quantity)}
                                    required
                                />
                            </Field>

                            <Field label="Price" error={tradeForm.errors.price} required>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={tradeForm.data.price}
                                    onChange={(event) => tradeForm.setData('price', event.target.value)}
                                    className={fieldClass(tradeForm.errors.price)}
                                    required
                                />
                            </Field>

                            <Field label="Executed At" error={tradeForm.errors.executed_at}>
                                <input
                                    type="datetime-local"
                                    value={tradeForm.data.executed_at}
                                    onChange={(event) => tradeForm.setData('executed_at', event.target.value)}
                                    className={fieldClass(tradeForm.errors.executed_at)}
                                />
                            </Field>
                        </div>

                        <Field label="PnL (Leader Trade)" error={tradeForm.errors.pnl}>
                            <input
                                type="number"
                                step="0.01"
                                value={tradeForm.data.pnl}
                                onChange={(event) => tradeForm.setData('pnl', event.target.value)}
                                className={fieldClass(tradeForm.errors.pnl)}
                                placeholder="Optional"
                            />
                        </Field>

                        <Field label="Internal Note" error={tradeForm.errors.note}>
                            <input
                                type="text"
                                value={tradeForm.data.note}
                                onChange={(event) => tradeForm.setData('note', event.target.value)}
                                className={fieldClass(tradeForm.errors.note)}
                                placeholder="Optional note for the metadata"
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={tradeSubmitDisabled}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {tradeForm.processing ? 'Executing...' : 'Execute Trade'}
                        </button>
                    </form>
                </section>

                <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-slate-100">Trade History</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Use <strong>Execute Copy Trade</strong> above to add history entries for this copy trader.
                        </p>
                    </div>

                    {tradeHistory.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                            No trade history yet for this copy trader.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tradeHistory.map((entry) => {
                                const isProfit = Number(entry.pnl || 0) >= 0;
                                const follower = entry?.follower?.name || entry?.follower?.email || 'Unknown follower';
                                const assetLabel = entry?.asset?.symbol || 'N/A';

                                return (
                                    <article
                                        key={entry.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-100">
                                                    {String(entry.side || '').toUpperCase()} {assetLabel}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {follower} • {entry.executed_at ? new Date(entry.executed_at).toLocaleString() : '-'}
                                                </p>
                                                {entry?.metadata?.note ? (
                                                    <p className="mt-1 text-xs text-slate-500">Note: {entry.metadata.note}</p>
                                                ) : null}
                                            </div>
                                            <p className={`text-lg font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {Number(entry.pnl || 0).toLocaleString(undefined, {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>

                                        <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                                            <p>Quantity: {Number(entry.quantity || 0).toLocaleString()}</p>
                                            <p>Price: {Number(entry.price || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
                                            <p>Ratio: {entry?.metadata?.copy_ratio ?? '-'}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
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

const fieldClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        hasError
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
