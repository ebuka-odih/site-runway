import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const date = (value) => (value ? new Date(value).toLocaleString() : '-');
const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

export default function Index({ users, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || 'all');
    const [verification, setVerification] = useState(filters.verification || 'all');
    const [fundingUser, setFundingUser] = useState(null);
    const hasMounted = useRef(false);
    const userRows = Array.isArray(users?.data) ? users.data : [];
    const userLinks = Array.isArray(users?.links) ? users.links : [];
    const fundForm = useForm({
        target: 'balance',
        amount: '',
        notes: '',
        redirect_to: 'index',
    });

    const applyFilters = (nextSearch, nextRole, nextVerification) => {
        router.get(
            '/admin/users',
            {
                search: nextSearch,
                role: nextRole,
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
            applyFilters(search, role, verification);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [search, role, verification]);

    const deleteUser = (userId, userName) => {
        if (!window.confirm(`Delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        router.delete(`/admin/users/${userId}`);
    };

    const openFundingModal = (user) => {
        setFundingUser(user);
        fundForm.clearErrors();
        fundForm.setData('target', 'balance');
        fundForm.setData('amount', '');
        fundForm.setData('notes', '');
        fundForm.setData('redirect_to', 'index');
    };

    const closeFundingModal = () => {
        setFundingUser(null);
        fundForm.clearErrors();
    };

    const submitFunding = (event) => {
        event.preventDefault();

        if (!fundingUser) {
            return;
        }

        fundForm.post(fundingUser.fund_url || `/admin/users/${fundingUser.id}/fund`, {
            preserveScroll: true,
            onSuccess: closeFundingModal,
        });
    };

    return (
        <AdminLayout title="User Management">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Total Users" value={stats.total_users} />
                <MiniStat label="Admin Users" value={stats.admin_users} />
                <MiniStat label="Verified Users" value={stats.verified_users} />
                <MiniStat label="Pending KYC" value={stats.pending_kyc} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">Manage Users</h3>

                    <Link
                        href="/admin/users/create"
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                    >
                        Create User
                    </Link>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, or username"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 md:col-span-2"
                    />

                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        <option value="all">All roles</option>
                        <option value="admin">Admins</option>
                        <option value="user">Users</option>
                    </select>

                    <select
                        value={verification}
                        onChange={(event) => setVerification(event.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                        <option value="all">All verification states</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                    </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">Search and filters apply automatically while typing.</p>

                <div className="mt-5 space-y-3 md:hidden">
                    {userRows.map((user) => (
                        <article key={user.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-slate-100">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                    <p className="text-xs text-slate-500">@{user.username}</p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs uppercase ${
                                        user.is_admin
                                            ? 'bg-cyan-500/20 text-cyan-200'
                                            : 'bg-slate-700 text-slate-200'
                                    }`}
                                >
                                    {user.is_admin ? 'Admin' : 'User'}
                                </span>
                            </div>

                            <dl className="mt-3 space-y-1 text-xs text-slate-400">
                                <div className="flex justify-between gap-2">
                                    <dt>Tier</dt>
                                    <dd className="uppercase text-slate-200">{user.membership_tier}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>KYC</dt>
                                    <dd className="uppercase text-slate-200">{user.kyc_status}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Balance</dt>
                                    <dd className="text-slate-200">{money(user.balance)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Profit</dt>
                                    <dd className="text-slate-200">{money(user.profit_balance)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Holding</dt>
                                    <dd className="text-slate-200">{money(user.holding_balance)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Orders / Positions</dt>
                                    <dd className="text-slate-300">
                                        {user.orders_count} / {user.positions_count}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>Joined</dt>
                                    <dd className="text-slate-300">{date(user.created_at)}</dd>
                                </div>
                            </dl>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                        user.email_verified
                                            ? 'bg-emerald-500/20 text-emerald-200'
                                            : 'bg-amber-500/20 text-amber-200'
                                    }`}
                                >
                                    {user.email_verified ? 'Verified' : 'Pending'}
                                </span>

                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={`/admin/users/${user.id}/edit`}
                                        className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openFundingModal(user)}
                                        className="rounded-lg border border-amber-500/60 px-2.5 py-1 text-xs text-amber-200 transition hover:bg-amber-500/10"
                                    >
                                        Fund
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteUser(user.id, user.name)}
                                        className="rounded-lg border border-rose-500/60 px-2.5 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="pb-3 pr-3">User</th>
                                <th className="pb-3 pr-3">Role</th>
                                <th className="pb-3 pr-3">Tier / KYC</th>
                                <th className="pb-3 pr-3">Funds</th>
                                <th className="pb-3 pr-3">Activity</th>
                                <th className="pb-3 pr-3">Verified</th>
                                <th className="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {userRows.map((user) => (
                                <tr key={user.id} className="transition hover:bg-slate-800/30">
                                    <td className="py-3 pr-3">
                                        <p className="font-medium text-slate-100">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                        <p className="text-xs text-slate-500">@{user.username}</p>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs uppercase ${
                                                user.is_admin
                                                    ? 'bg-cyan-500/20 text-cyan-200'
                                                    : 'bg-slate-700 text-slate-200'
                                            }`}
                                        >
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3 text-xs uppercase text-slate-300">
                                        <p>{user.membership_tier}</p>
                                        <p className="mt-1 text-slate-500">KYC: {user.kyc_status}</p>
                                    </td>
                                    <td className="py-3 pr-3 text-xs text-slate-300">
                                        <p>Balance: {money(user.balance)}</p>
                                        <p>Profit: {money(user.profit_balance)}</p>
                                        <p className="mt-1">Holding: {money(user.holding_balance)}</p>
                                    </td>
                                    <td className="py-3 pr-3 text-xs text-slate-400">
                                        <p>Orders: {user.orders_count}</p>
                                        <p>Positions: {user.positions_count}</p>
                                        <p className="mt-1">Joined: {date(user.created_at)}</p>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs ${
                                                user.email_verified
                                                    ? 'bg-emerald-500/20 text-emerald-200'
                                                    : 'bg-amber-500/20 text-amber-200'
                                            }`}
                                        >
                                            {user.email_verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/admin/users/${user.id}/edit`}
                                                className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openFundingModal(user)}
                                                className="rounded-lg border border-amber-500/60 px-2.5 py-1 text-xs text-amber-200 transition hover:bg-amber-500/10"
                                            >
                                                Fund
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteUser(user.id, user.name)}
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
                    {userLinks.map((link) => (
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

            {fundingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                    <button
                        type="button"
                        className="absolute inset-0"
                        onClick={closeFundingModal}
                        aria-label="Close funding modal"
                    />

                    <section className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="text-lg font-semibold text-slate-100">Fund User Account</h4>
                                <p className="text-xs text-slate-400">
                                    {fundingUser.name} ({fundingUser.email})
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeFundingModal}
                                className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                            <InfoChip label="Balance" value={money(fundingUser.balance)} />
                            <InfoChip label="Profit" value={money(fundingUser.profit_balance)} />
                            <InfoChip label="Holding" value={money(fundingUser.holding_balance)} />
                        </div>

                        <form onSubmit={submitFunding} className="mt-5 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">
                                        Target <span className="text-rose-300">*</span>
                                    </span>
                                    <select
                                        value={fundForm.data.target}
                                        onChange={(event) => fundForm.setData('target', event.target.value)}
                                        className={fieldClass(fundForm.errors.target)}
                                        required
                                    >
                                        <option value="balance">Balance</option>
                                        <option value="profit_balance">Profit Balance</option>
                                        <option value="holding_balance">Holding Balance</option>
                                    </select>
                                    {fundForm.errors.target && (
                                        <span className="mt-1 block text-xs text-rose-300">{fundForm.errors.target}</span>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">
                                        Amount (USD) <span className="text-rose-300">*</span>
                                    </span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={fundForm.data.amount}
                                        onChange={(event) => fundForm.setData('amount', event.target.value)}
                                        className={fieldClass(fundForm.errors.amount)}
                                        placeholder="100.00"
                                        required
                                    />
                                    {fundForm.errors.amount && (
                                        <span className="mt-1 block text-xs text-rose-300">{fundForm.errors.amount}</span>
                                    )}
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-2 block text-sm text-slate-300">Notes</span>
                                    <input
                                        type="text"
                                        value={fundForm.data.notes}
                                        onChange={(event) => fundForm.setData('notes', event.target.value)}
                                        className={fieldClass(fundForm.errors.notes)}
                                        placeholder="Optional audit note"
                                    />
                                    {fundForm.errors.notes && (
                                        <span className="mt-1 block text-xs text-rose-300">{fundForm.errors.notes}</span>
                                    )}
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    disabled={fundForm.processing}
                                    className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {fundForm.processing ? 'Funding...' : 'Fund Account'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeFundingModal}
                                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}

function MiniStat({ label, value }) {
    return (
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </article>
    );
}

function InfoChip({ label, value }) {
    return (
        <article className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
        </article>
    );
}

const fieldClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        hasError
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
