import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const date = (value) => (value ? new Date(value).toLocaleString() : '-');
const shortWallet = (value) =>
    value && value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value || '-';

export default function Index({ methods, filters, filter_options, stats, usage }) {
    const [search, setSearch] = useState(filters.search || '');
    const [channel, setChannel] = useState(filters.channel || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const hasMounted = useRef(false);
    const methodsData = Array.isArray(methods?.data) ? methods.data : [];
    const methodsLinks = Array.isArray(methods?.links) ? methods.links : [];
    const usageRows = Array.isArray(usage) ? usage : [];
    const channels = Array.isArray(filter_options?.channels) ? filter_options.channels : ['all'];
    const statuses = Array.isArray(filter_options?.statuses) ? filter_options.statuses : ['all', 'active', 'inactive'];

    const applyFilters = (nextSearch, nextChannel, nextStatus) => {
        router.get(
            '/admin/payment-methods',
            {
                search: nextSearch,
                channel: nextChannel,
                status: nextStatus,
                page: 1,
            },
            {
                preserveState: false,
                replace: true,
                preserveScroll: true,
            }
        );
    };

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;

            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            applyFilters(search, channel, status);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [search, channel, status]);

    const deleteMethod = (methodId, methodName) => {
        if (!window.confirm(`Delete ${methodName}? This action cannot be undone.`)) {
            return;
        }

        router.delete(`/admin/payment-methods/${methodId}`);
    };

    return (
        <AdminLayout title="Payment Methods">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Total Methods" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Inactive" value={stats.inactive} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">Manage Payment Methods</h3>

                    <Link
                        href="/admin/payment-methods/create"
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                    >
                        Add Method
                    </Link>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, channel, currency, network, wallet"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 md:col-span-2"
                    />

                    <select
                        value={channel}
                        onChange={(event) => setChannel(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        {channels.map((entry) => (
                            <option key={entry} value={entry}>
                                {entry === 'all' ? 'All Channels' : entry}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        {statuses.map((entry) => (
                            <option key={entry} value={entry}>
                                {entry === 'all' ? 'All Statuses' : entry}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">Search and dropdown filters apply automatically.</p>

                <div className="mt-5 space-y-3 md:hidden">
                    {methodsData.map((method) => (
                        <article key={method.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-slate-100">{method.name}</p>
                                    <p className="text-xs uppercase text-slate-400">
                                        {method.channel} · {method.currency}
                                    </p>
                                </div>
                                <StatusBadge value={method.status} />
                            </div>

                            <dl className="mt-3 space-y-1 text-xs text-slate-400">
                                <div className="flex justify-between gap-2">
                                    <dt>Network</dt>
                                    <dd className="text-slate-300">{method.network || '-'}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Order</dt>
                                    <dd className="text-slate-300">{method.display_order}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Wallet Address</dt>
                                    <dd className="max-w-[180px] truncate text-slate-300">
                                        {method.channel === 'crypto'
                                            ? method.wallet_address || 'Required for crypto'
                                            : '-'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Updated</dt>
                                    <dd className="text-slate-300">{date(method.updated_at)}</dd>
                                </div>
                            </dl>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={`/admin/payment-methods/${method.id}/edit`}
                                    className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => deleteMethod(method.id, method.name)}
                                    className="rounded-lg border border-rose-500/60 px-2.5 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="pb-3 pr-3">Name</th>
                                <th className="pb-3 pr-3">Channel</th>
                                <th className="pb-3 pr-3">Currency</th>
                                <th className="pb-3 pr-3">Network</th>
                                <th className="pb-3 pr-3">Wallet Address</th>
                                <th className="pb-3 pr-3">Status</th>
                                <th className="pb-3 pr-3">Updated</th>
                                <th className="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {methodsData.map((method) => (
                                <tr key={method.id} className="transition hover:bg-slate-800/30">
                                    <td className="py-3 pr-3">
                                        <p className="font-medium text-slate-100">{method.name}</p>
                                        <p className="text-xs text-slate-500">Order: {method.display_order}</p>
                                    </td>
                                    <td className="py-3 pr-3 uppercase">{method.channel}</td>
                                    <td className="py-3 pr-3 uppercase">{method.currency}</td>
                                    <td className="py-3 pr-3 uppercase">{method.network || '-'}</td>
                                    <td className="py-3 pr-3">
                                        {method.channel === 'crypto'
                                            ? shortWallet(method.wallet_address)
                                            : '-'}
                                    </td>
                                    <td className="py-3 pr-3">
                                        <StatusBadge value={method.status} />
                                    </td>
                                    <td className="py-3 pr-3 text-xs text-slate-400">{date(method.updated_at)}</td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/admin/payment-methods/${method.id}/edit`}
                                                className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => deleteMethod(method.id, method.name)}
                                                className="rounded-lg border border-rose-500/60 px-2.5 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {methodsLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.url || '#'}
                            preserveState
                            preserveScroll
                            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                                link.active
                                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                                    : link.url
                                      ? 'border-slate-700 text-slate-300 hover:border-cyan-500/40'
                                      : 'cursor-not-allowed border-slate-800 text-slate-600'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-slate-100">Deposit Usage Snapshot</h3>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="pb-3 pr-3">Currency</th>
                                <th className="pb-3 pr-3">Requests</th>
                                <th className="pb-3">Total Volume (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {usageRows.map((row) => (
                                <tr key={row.currency}>
                                    <td className="py-3 pr-3 uppercase text-slate-100">{row.currency}</td>
                                    <td className="py-3 pr-3">{row.requests_count}</td>
                                    <td className="py-3">{money(row.total_amount)}</td>
                                </tr>
                            ))}

                            {usageRows.length === 0 && (
                                <tr>
                                    <td className="py-4 text-slate-500" colSpan={3}>
                                        No usage data yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </article>
    );
}

function StatusBadge({ value }) {
    const styles =
        value === 'active'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-slate-600 bg-slate-700/20 text-slate-200';

    return <span className={`rounded-full border px-2 py-1 text-xs uppercase ${styles}`}>{value}</span>;
}
