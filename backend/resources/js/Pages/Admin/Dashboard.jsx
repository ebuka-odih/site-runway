import AdminLayout from '@/Layouts/AdminLayout';

const numberFormatter = new Intl.NumberFormat();

const dateTime = (value) => {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
};

const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

export default function Dashboard({ stats, recentUsers, recentTransactions }) {
    return (
        <AdminLayout title="Dashboard">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Total Users" value={numberFormatter.format(stats.users_total)} tone="cyan" />
                <StatCard label="Admin Users" value={numberFormatter.format(stats.users_admin)} tone="emerald" />
                <StatCard label="Wallets" value={numberFormatter.format(stats.wallets_total)} tone="blue" />
                <StatCard
                    label="Pending Transactions"
                    value={numberFormatter.format(stats.pending_transactions)}
                    tone="amber"
                />
                <StatCard
                    label="Pending Deposits"
                    value={numberFormatter.format(stats.pending_deposits)}
                    tone="violet"
                />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr,1fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                    <h3 className="mb-4 text-base font-semibold text-slate-100">Recent Transactions</h3>

                    <div className="space-y-3 md:hidden">
                        {recentTransactions.map((transaction) => (
                            <article
                                key={transaction.id}
                                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            {transaction.user_name ?? 'Unknown user'}
                                        </p>
                                        <p className="text-xs text-slate-500">{transaction.user_email ?? '-'}</p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase text-slate-200">
                                        {transaction.status}
                                    </span>
                                </div>

                                <dl className="mt-3 space-y-1 text-xs text-slate-400">
                                    <div className="flex justify-between gap-2">
                                        <dt>Type</dt>
                                        <dd className="uppercase text-slate-200">{transaction.type}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt>Amount</dt>
                                        <dd className="text-slate-100">
                                            {money(transaction.amount)} {transaction.asset_symbol ?? ''}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt>Date</dt>
                                        <dd className="text-slate-300">{dateTime(transaction.occurred_at)}</dd>
                                    </div>
                                </dl>
                            </article>
                        ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="pb-3 pr-3">User</th>
                                    <th className="pb-3 pr-3">Type</th>
                                    <th className="pb-3 pr-3">Amount</th>
                                    <th className="pb-3 pr-3">Status</th>
                                    <th className="pb-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {recentTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="transition hover:bg-slate-800/40">
                                        <td className="py-3 pr-3">
                                            <p className="font-medium text-slate-100">
                                                {transaction.user_name ?? 'Unknown user'}
                                            </p>
                                            <p className="text-xs text-slate-500">{transaction.user_email ?? '-'}</p>
                                        </td>
                                        <td className="py-3 pr-3 uppercase">{transaction.type}</td>
                                        <td className="py-3 pr-3">
                                            {money(transaction.amount)} {transaction.asset_symbol ?? ''}
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-xs uppercase">
                                                {transaction.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-xs text-slate-400">{dateTime(transaction.occurred_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                    <h3 className="mb-4 text-base font-semibold text-slate-100">Newest Users</h3>
                    <div className="space-y-3">
                        {recentUsers.map((user) => (
                            <div
                                key={user.id}
                                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 transition hover:border-cyan-500/40"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-slate-100">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs uppercase ${
                                            user.is_admin
                                                ? 'bg-cyan-500/20 text-cyan-200'
                                                : 'bg-slate-700/60 text-slate-200'
                                        }`}
                                    >
                                        {user.is_admin ? 'Admin' : user.membership_tier}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Joined {dateTime(user.created_at)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}

function StatCard({ label, value, tone }) {
    const tones = {
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
        emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
        amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
        violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    };

    return (
        <article className={`rounded-2xl border bg-gradient-to-br p-4 ${tones[tone]}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </article>
    );
}
