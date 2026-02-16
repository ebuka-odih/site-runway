import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const tabs = [
    { key: 'deposit', label: 'Deposits' },
    { key: 'withdrawal', label: 'Withdrawals' },
];

const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const date = (value) => (value ? new Date(value).toLocaleString() : '-');
const shortId = (value) => (value && value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value || '-');
const shortHash = (value) => (value && value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value || '-');

export default function Index({ activeTab = 'deposit', transactions, stats }) {
    const { url } = usePage();
    const rows = Array.isArray(transactions?.data) ? transactions.data : [];
    const links = Array.isArray(transactions?.links) ? transactions.links : [];
    const [selectedId, setSelectedId] = useState(null);

    const selectedTransaction = useMemo(
        () => rows.find((row) => row.id === selectedId) || null,
        [rows, selectedId]
    );

    const closeModal = () => setSelectedId(null);

    const switchTab = (tab) => {
        if (tab === activeTab) {
            return;
        }

        router.get(
            adminPath(url, 'transactions'),
            { tab, page: 1 },
            {
                preserveState: false,
                replace: true,
            }
        );
    };

    const approveTransaction = () => {
        if (!selectedTransaction?.can_approve) {
            return;
        }

        if (!window.confirm(`Approve transaction ${shortId(selectedTransaction.id)}?`)) {
            return;
        }

        router.post(selectedTransaction.approve_url, {}, { preserveScroll: true, onSuccess: closeModal });
    };

    const declineTransaction = () => {
        if (!selectedTransaction?.can_decline) {
            return;
        }

        if (!window.confirm(`Decline transaction ${shortId(selectedTransaction.id)}?`)) {
            return;
        }

        router.post(selectedTransaction.decline_url, {}, { preserveScroll: true, onSuccess: closeModal });
    };

    const deleteTransaction = () => {
        if (!selectedTransaction?.can_delete) {
            return;
        }

        if (!window.confirm(`Delete transaction ${shortId(selectedTransaction.id)}? This cannot be undone.`)) {
            return;
        }

        router.delete(selectedTransaction.delete_url, { preserveScroll: true, onSuccess: closeModal });
    };

    return (
        <AdminLayout title="Transactions">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total" value={stats.total} />
                <Stat label="Pending" value={stats.pending} />
                <Stat label="Approved" value={stats.approved} />
                <Stat label="Rejected" value={stats.rejected} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">All Transactions</h3>

                    <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950/70 p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => switchTab(tab.key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition sm:px-4 ${
                                    activeTab === tab.key
                                        ? 'bg-cyan-500/20 text-cyan-100'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="mt-2 text-xs text-slate-400">Sorted by latest first</p>

                {rows.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
                        No transactions found.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 space-y-3 md:hidden">
                            {rows.map((transaction) => (
                                <article key={transaction.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-slate-100">{transaction.user_name || 'Unknown user'}</p>
                                            <p className="text-xs text-slate-500">{transaction.user_email || '-'}</p>
                                        </div>
                                        <StatusBadge value={transaction.status} />
                                    </div>

                                    <dl className="mt-3 space-y-1 text-xs text-slate-400">
                                        <div className="flex justify-between gap-2">
                                            <dt>ID</dt>
                                            <dd className="font-mono text-slate-300">{shortId(transaction.id)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt>Type</dt>
                                            <dd className="uppercase text-slate-200">{transaction.type}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt>Currency</dt>
                                            <dd className="uppercase text-slate-200">
                                                {transaction.currency} {transaction.network ? `(${transaction.network})` : ''}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt>Amount</dt>
                                            <dd className="text-slate-100">{money(transaction.amount)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt>Submitted</dt>
                                            <dd className="text-slate-300">{date(transaction.submitted_at || transaction.created_at)}</dd>
                                        </div>
                                    </dl>

                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(transaction.id)}
                                            className="rounded-lg border border-cyan-500/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/10"
                                        >
                                            Action
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-4 hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-wide text-slate-400">
                                    <tr>
                                        <th className="pb-3 pr-3">User</th>
                                        <th className="pb-3 pr-3">Type</th>
                                        <th className="pb-3 pr-3">Currency / Network</th>
                                        <th className="pb-3 pr-3">Amount</th>
                                        <th className="pb-3 pr-3">Status</th>
                                        <th className="pb-3 pr-3">Submitted</th>
                                        <th className="pb-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {rows.map((transaction) => (
                                        <tr key={transaction.id} className="transition hover:bg-slate-800/30">
                                            <td className="py-3 pr-3">
                                                <p className="font-medium text-slate-100">{transaction.user_name || 'Unknown user'}</p>
                                                <p className="text-xs text-slate-500">{transaction.user_email || '-'}</p>
                                            </td>
                                            <td className="py-3 pr-3 uppercase">{transaction.type}</td>
                                            <td className="py-3 pr-3 uppercase">
                                                {transaction.currency} {transaction.network ? `(${transaction.network})` : ''}
                                            </td>
                                            <td className="py-3 pr-3">{money(transaction.amount)}</td>
                                            <td className="py-3 pr-3">
                                                <StatusBadge value={transaction.status} />
                                            </td>
                                            <td className="py-3 pr-3 text-xs text-slate-400">
                                                {date(transaction.submitted_at || transaction.created_at)}
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedId(transaction.id)}
                                                    className="rounded-lg border border-cyan-500/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/10"
                                                >
                                                    Action
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <PaginationLinks links={links} className="mt-5" />
            </section>

            <ActionModal
                transaction={selectedTransaction}
                onClose={closeModal}
                onApprove={approveTransaction}
                onDecline={declineTransaction}
                onDelete={deleteTransaction}
            />
        </AdminLayout>
    );
}

function Stat({ label, value }) {
    return (
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </article>
    );
}

function StatusBadge({ value }) {
    const color =
        value === 'approved'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : value === 'rejected'
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              : value === 'processing' || value === 'payment' || value === 'input' || value === 'pending'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-slate-700 bg-slate-700/20 text-slate-200';

    return <span className={`rounded-full border px-2 py-1 text-xs uppercase ${color}`}>{value}</span>;
}

function PaginationLinks({ links, className }) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <div className={`${className} flex flex-wrap gap-2`}>
            {links.map((link) => (
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
    );
}

function ActionModal({ transaction, onClose, onApprove, onDecline, onDelete }) {
    if (!transaction) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close action modal" />

            <section className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-100">Transaction Action</h4>
                        <p className="text-xs text-slate-400">{shortId(transaction.id)}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>

                <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <Info label="User" value={transaction.user_name || 'Unknown user'} />
                    <Info label="Email" value={transaction.user_email || '-'} />
                    <Info label="Type" value={(transaction.type || '-').toUpperCase()} />
                    <Info
                        label="Currency"
                        value={`${transaction.currency || '-'}${transaction.network ? ` (${transaction.network})` : ''}`}
                    />
                    <Info label="Amount" value={money(transaction.amount)} />
                    <Info label="Status" value={(transaction.status || '-').toUpperCase()} />
                    <Info label="Tx Hash" value={shortHash(transaction.transaction_hash)} />
                    <Info label="Submitted" value={date(transaction.submitted_at || transaction.created_at)} />
                    <Info label="Processed" value={date(transaction.processed_at)} />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                    {transaction.has_receipt ? (
                        <a
                            href={transaction.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                        >
                            View
                        </a>
                    ) : (
                        <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500">No Receipt</span>
                    )}

                    <button
                        type="button"
                        onClick={onApprove}
                        disabled={!transaction.can_approve}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                        Approve
                    </button>

                    <button
                        type="button"
                        onClick={onDecline}
                        disabled={!transaction.can_decline}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                        Decline
                    </button>

                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={!transaction.can_delete}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                        Delete
                    </button>
                </div>
            </section>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-xs text-slate-200">{value}</p>
        </div>
    );
}
