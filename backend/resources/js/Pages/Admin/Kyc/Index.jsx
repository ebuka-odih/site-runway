import AdminLayout from '@/Layouts/AdminLayout';
import { adminPath } from '@/lib/adminPath';
import { Link, router, usePage } from '@inertiajs/react';

const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const date = (value) => (value ? new Date(value).toLocaleString() : '-');

const documentTypeLabel = (value) => {
    const labels = {
        drivers_license: 'Driver License',
        international_passport: 'International Passport',
        national_id_card: 'National ID Card',
    };

    return labels[value] || value || '-';
};

export default function Index({ submissions, filters, stats }) {
    const { url } = usePage();
    const rows = Array.isArray(submissions?.data) ? submissions.data : [];
    const links = Array.isArray(submissions?.links) ? submissions.links : [];
    const activeStatus = filters?.status || 'all';

    const applyFilter = (nextStatus) => {
        router.get(
            adminPath(url, 'kyc'),
            { status: nextStatus, page: 1 },
            {
                preserveState: false,
                replace: true,
            }
        );
    };

    const approve = (submission) => {
        if (!submission?.can_approve) {
            return;
        }

        if (!window.confirm(`Approve KYC for ${submission.user_name || 'this user'}?`)) {
            return;
        }

        router.post(submission.approve_url, {}, { preserveScroll: true });
    };

    const decline = (submission) => {
        if (!submission?.can_decline) {
            return;
        }

        const reviewNotes = window.prompt('Optional decline reason to send to user:', '') || '';

        if (!window.confirm(`Decline KYC for ${submission.user_name || 'this user'}?`)) {
            return;
        }

        router.post(
            submission.decline_url,
            { review_notes: reviewNotes.trim() || null },
            { preserveScroll: true }
        );
    };

    return (
        <AdminLayout title="KYC Reviews">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total" value={stats.total} />
                <Stat label="Pending" value={stats.pending} />
                <Stat label="Approved" value={stats.approved} />
                <Stat label="Rejected" value={stats.rejected} />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">KYC Submissions</h3>

                    <label className="text-xs text-slate-300">
                        <span className="mr-2 uppercase tracking-wide text-slate-500">Filter</span>
                        <select
                            value={activeStatus}
                            onChange={(event) => applyFilter(event.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {rows.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
                        No KYC submissions found.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="pb-3 pr-3">User</th>
                                    <th className="pb-3 pr-3">Document</th>
                                    <th className="pb-3 pr-3">Location</th>
                                    <th className="pb-3 pr-3">Status</th>
                                    <th className="pb-3 pr-3">Submitted</th>
                                    <th className="pb-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {rows.map((submission) => (
                                    <tr key={submission.id} className="transition hover:bg-slate-800/30">
                                        <td className="py-3 pr-3">
                                            <p className="font-medium text-slate-100">{submission.user_name || 'Unknown user'}</p>
                                            <p className="text-xs text-slate-500">{submission.user_email || '-'}</p>
                                        </td>
                                        <td className="py-3 pr-3">{documentTypeLabel(submission.document_type)}</td>
                                        <td className="py-3 pr-3">{submission.city}, {submission.country}</td>
                                        <td className="py-3 pr-3">
                                            <StatusBadge value={submission.status} />
                                        </td>
                                        <td className="py-3 pr-3 text-xs text-slate-400">{date(submission.submitted_at)}</td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <a
                                                    href={submission.document_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-cyan-500/50 px-2.5 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10"
                                                >
                                                    View Doc
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => approve(submission)}
                                                    disabled={!submission.can_approve}
                                                    className="rounded-lg border border-emerald-500/50 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => decline(submission)}
                                                    disabled={!submission.can_decline}
                                                    className="rounded-lg border border-rose-500/50 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationLinks links={links} className="mt-5" />
            </section>
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
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200';

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
