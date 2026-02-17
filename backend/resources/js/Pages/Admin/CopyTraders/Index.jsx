import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const percent = (value) => `${Number(value || 0).toFixed(2)}%`;
const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
const dateTime = (value) => (value ? new Date(value).toLocaleString() : '-');

export default function Index({ traders, filters, stats }) {
    const { url } = usePage();
    const baseUrl = adminPath(url, 'copy-traders');
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [verification, setVerification] = useState(filters.verification || 'all');
    const hasMounted = useRef(false);
    const tradersData = Array.isArray(traders?.data) ? traders.data : [];
    const tradersLinks = Array.isArray(traders?.links) ? traders.links : [];

    const applyFilters = (nextSearch, nextStatus, nextVerification) => {
        router.get(
            baseUrl,
            {
                search: nextSearch,
                status: nextStatus,
                verification: nextVerification,
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
            applyFilters(search, status, verification);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [search, status, verification]);

    return (
        <AdminLayout title="Copy Traders">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Traders" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Inactive" value={stats.inactive} />
                <StatCard label="Verified" value={stats.verified} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">Manage Copy Traders</h3>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, username, or strategy"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 md:col-span-3"
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        {['all', 'active', 'inactive'].map((entry) => (
                            <option key={entry} value={entry}>
                                {entry === 'all' ? 'All Statuses' : entry}
                            </option>
                        ))}
                    </select>

                    <select
                        value={verification}
                        onChange={(event) => setVerification(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        {['all', 'verified', 'unverified'].map((entry) => (
                            <option key={entry} value={entry}>
                                {entry === 'all' ? 'All Verification' : entry}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">Filters apply automatically as you type.</p>

                <div className="mt-5 space-y-3 md:hidden">
                    {tradersData.map((trader) => (
                        <article key={trader.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-slate-100">{trader.display_name}</p>
                                    <p className="text-xs text-slate-500">@{trader.username}</p>
                                </div>
                                <StatusBadge value={trader.is_active ? 'active' : 'inactive'} />
                            </div>

                            <dl className="mt-3 space-y-1 text-xs text-slate-400">
                                <div className="flex justify-between gap-2">
                                    <dt>Strategy</dt>
                                    <dd className="text-slate-200">{trader.strategy}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Copy Fee</dt>
                                    <dd className="text-slate-200">{money(trader.copy_fee)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Return</dt>
                                    <dd className="text-slate-200">{percent(trader.total_return)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Win Rate</dt>
                                    <dd className="text-slate-200">{percent(trader.win_rate)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Copiers</dt>
                                    <dd className="text-slate-200">{trader.copiers_count}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Joined</dt>
                                    <dd className="text-slate-300">{dateTime(trader.joined_at)}</dd>
                                </div>
                            </dl>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={adminPath(url, `copy-traders/${trader.id}/edit`)}
                                    className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                >
                                    Edit
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="pb-3 pr-3">Trader</th>
                                <th className="pb-3 pr-3">Strategy</th>
                                <th className="pb-3 pr-3">Copy Fee</th>
                                <th className="pb-3 pr-3">Return</th>
                                <th className="pb-3 pr-3">Win Rate</th>
                                <th className="pb-3 pr-3">Copiers</th>
                                <th className="pb-3 pr-3">Risk</th>
                                <th className="pb-3 pr-3">Status</th>
                                <th className="pb-3 pr-3">Joined</th>
                                <th className="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {tradersData.map((trader) => (
                                <tr key={trader.id} className="transition hover:bg-slate-800/30">
                                    <td className="py-3 pr-3">
                                        <p className="font-medium text-slate-100">{trader.display_name}</p>
                                        <p className="text-xs text-slate-500">@{trader.username}</p>
                                    </td>
                                    <td className="py-3 pr-3">{trader.strategy}</td>
                                    <td className="py-3 pr-3">{money(trader.copy_fee)}</td>
                                    <td className="py-3 pr-3">{percent(trader.total_return)}</td>
                                    <td className="py-3 pr-3">{percent(trader.win_rate)}</td>
                                    <td className="py-3 pr-3">{trader.copiers_count}</td>
                                    <td className="py-3 pr-3">{trader.risk_score}</td>
                                    <td className="py-3 pr-3">
                                        <StatusBadge value={trader.is_active ? 'active' : 'inactive'} />
                                    </td>
                                    <td className="py-3 pr-3 text-xs text-slate-400">{dateTime(trader.joined_at)}</td>
                                    <td className="py-3">
                                        <Link
                                            href={adminPath(url, `copy-traders/${trader.id}/edit`)}
                                            className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {tradersLinks.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        {tradersLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.url || ''}
                                preserveScroll
                                className={`rounded-lg border px-3 py-1 text-xs ${
                                    link.active
                                        ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-100'
                                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                                } ${link.url ? '' : 'pointer-events-none opacity-50'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </article>
    );
}

function StatusBadge({ value }) {
    const normalized = value === 'active' ? 'active' : 'inactive';

    return (
        <span
            className={`rounded-full border px-2 py-1 text-[10px] uppercase ${
                normalized === 'active'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-700 text-slate-300'
            }`}
        >
            {normalized}
        </span>
    );
}
