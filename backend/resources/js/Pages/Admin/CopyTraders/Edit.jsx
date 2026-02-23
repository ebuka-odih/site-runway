import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

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

const formatDateTime = (value) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return parsed.toLocaleString();
};

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
const formatSignedCurrency = (value) => {
    const numericValue = Number(value || 0);

    if (numericValue < 0) {
        return `-${formatCurrency(Math.abs(numericValue))}`;
    }

    return formatCurrency(numericValue);
};

export default function Edit({ trader, assets, active_followers, followers = [], pnl_history = [] }) {
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
        side: 'buy',
        quantity: '',
        price: firstAsset?.price ?? '',
        executed_at: '',
        pnl: '',
        note: '',
    });

    const initialFollowerId = followers[0]?.id || '';
    const [selectedFollowerId, setSelectedFollowerId] = useState(initialFollowerId);
    const followerPnlForm = useForm({
        copy_relationship_id: initialFollowerId,
        pnl: '',
        executed_at: '',
        note: '',
    });

    const selectedFollower = useMemo(
        () => followers.find((follower) => follower.id === selectedFollowerId) ?? null,
        [followers, selectedFollowerId],
    );

    const selectedFollowerHistory = useMemo(() => {
        if (!selectedFollowerId) {
            return [];
        }

        return pnl_history.filter((entry) => entry.copy_relationship_id === selectedFollowerId);
    }, [pnl_history, selectedFollowerId]);

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

    const submitFollowerPnl = (event) => {
        event.preventDefault();

        if (!followerPnlForm.data.copy_relationship_id) {
            return;
        }

        followerPnlForm.post(adminPath(url, `copy-traders/${trader.id}/followers/pnl`), {
            preserveScroll: true,
            onSuccess: () => {
                followerPnlForm.reset('pnl', 'executed_at', 'note');
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

    const handleSelectFollower = (followerId) => {
        setSelectedFollowerId(followerId);
        followerPnlForm.setData('copy_relationship_id', followerId);
    };

    return (
        <AdminLayout title={`Edit ${trader.display_name}`}>
            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
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

                <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-100">Execute Copy Trade</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Applies the trade to {active_followers} active follower{active_followers === 1 ? '' : 's'}.
                            Quantity and PnL scale by each follower&apos;s copy ratio.
                        </p>
                    </div>

                    <form onSubmit={submitTrade} className="space-y-4">
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
                            disabled={tradeForm.processing || active_followers === 0}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {tradeForm.processing ? 'Executing...' : 'Execute Trade'}
                        </button>
                    </form>
                </section>

                <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-slate-100">Follower PnL History</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Select a copied user, click <strong>Edit PnL</strong>, and create manual Profit/Loss history entries.
                        </p>
                    </div>

                    {followers.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
                            This trader has no copied users yet.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-slate-800">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Copy Ratio</th>
                                            <th className="px-4 py-3">Current PnL</th>
                                            <th className="px-4 py-3">Trades</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {followers.map((follower) => {
                                            const displayName =
                                                follower.user?.name ||
                                                follower.user?.username ||
                                                follower.user?.email ||
                                                'Unknown user';
                                            const isSelected = selectedFollowerId === follower.id;

                                            return (
                                                <tr key={follower.id} className="bg-slate-950/60">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-slate-100">{displayName}</p>
                                                        {follower.user?.email && (
                                                            <p className="text-xs text-slate-500">{follower.user.email}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RelationshipStatusBadge status={follower.status} />
                                                    </td>
                                                    <td className="px-4 py-3">{Number(follower.copy_ratio).toFixed(2)}x</td>
                                                    <td className="px-4 py-3">{formatCurrency(follower.pnl)}</td>
                                                    <td className="px-4 py-3">{follower.trades_count}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectFollower(follower.id)}
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
                                                            }`}
                                                        >
                                                            Edit PnL
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {followerPnlForm.errors.copy_relationship_id && (
                                <p className="mt-3 text-xs text-rose-300">{followerPnlForm.errors.copy_relationship_id}</p>
                            )}

                            <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
                                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-slate-100">Create PnL Entry</h3>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {selectedFollower
                                                ? `Selected user: ${
                                                      selectedFollower.user?.name ||
                                                      selectedFollower.user?.username ||
                                                      selectedFollower.user?.email ||
                                                      'Unknown user'
                                                  }`
                                                : 'Select a user first.'}
                                        </p>
                                    </div>

                                    <form onSubmit={submitFollowerPnl} className="space-y-4">
                                        <Field label="PnL Amount" error={followerPnlForm.errors.pnl} required>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={followerPnlForm.data.pnl}
                                                onChange={(event) => followerPnlForm.setData('pnl', event.target.value)}
                                                className={fieldClass(followerPnlForm.errors.pnl)}
                                                placeholder="Use + for profit and - for loss"
                                                required
                                            />
                                        </Field>

                                        <Field label="Date & Time" error={followerPnlForm.errors.executed_at}>
                                            <input
                                                type="datetime-local"
                                                value={followerPnlForm.data.executed_at}
                                                onChange={(event) =>
                                                    followerPnlForm.setData('executed_at', event.target.value)
                                                }
                                                className={fieldClass(followerPnlForm.errors.executed_at)}
                                            />
                                        </Field>

                                        <Field label="Note" error={followerPnlForm.errors.note}>
                                            <input
                                                type="text"
                                                value={followerPnlForm.data.note}
                                                onChange={(event) => followerPnlForm.setData('note', event.target.value)}
                                                className={fieldClass(followerPnlForm.errors.note)}
                                                placeholder="Optional internal note"
                                            />
                                        </Field>

                                        <button
                                            type="submit"
                                            disabled={
                                                followerPnlForm.processing ||
                                                !followerPnlForm.data.copy_relationship_id
                                            }
                                            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {followerPnlForm.processing ? 'Saving...' : 'Add PnL History'}
                                        </button>
                                    </form>
                                </section>

                                <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                                    <div className="mb-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Performance</p>
                                        <h3 className="mt-1 text-2xl font-bold text-slate-100">PnL History</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedFollowerHistory.length === 0 ? (
                                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                                                No PnL history entries for this user yet.
                                            </div>
                                        ) : (
                                            selectedFollowerHistory.map((entry) => {
                                                const isProfit =
                                                    String(entry.entry_type || '').toLowerCase() === 'profit' ||
                                                    Number(entry.pnl) >= 0;

                                                return (
                                                    <article
                                                        key={entry.id}
                                                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className={`mt-1 h-3 w-3 rounded-full ${
                                                                    isProfit ? 'bg-emerald-400' : 'bg-rose-400'
                                                                }`}
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-slate-100">
                                                                    {isProfit ? 'Profit' : 'Loss'}
                                                                </p>
                                                                <p className="text-sm text-slate-400">
                                                                    {formatDateTime(entry.executed_at)}
                                                                </p>
                                                                {entry.note && (
                                                                    <p className="mt-1 text-xs text-slate-500">{entry.note}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p
                                                            className={`text-xl font-semibold ${
                                                                isProfit ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}
                                                        >
                                                            {formatSignedCurrency(entry.pnl)}
                                                        </p>
                                                    </article>
                                                );
                                            })
                                        )}
                                    </div>
                                </section>
                            </div>
                        </>
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

function RelationshipStatusBadge({ status }) {
    const normalized = status === 'active' || status === 'paused' || status === 'closed' ? status : 'paused';

    const className =
        normalized === 'active'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : normalized === 'paused'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-slate-700 text-slate-300';

    return <span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${className}`}>{normalized}</span>;
}

const fieldClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        hasError
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
