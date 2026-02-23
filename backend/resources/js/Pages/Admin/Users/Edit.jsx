import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Pages/Admin/Users/UserForm';
import { adminPath } from '@/lib/adminPath';
import { useForm, usePage } from '@inertiajs/react';

const money = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

export default function Edit({ user, options }) {
    const { url } = usePage();
    const form = useForm({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        membership_tier: user.membership_tier || 'free',
        kyc_status: user.kyc_status || 'pending',
        timezone: user.timezone || '',
        password: '',
        password_confirmation: '',
        notification_email_alerts: Boolean(user.notification_email_alerts),
        email_verified: Boolean(user.email_verified),
        is_admin: Boolean(user.is_admin),
    });

    const fundingForm = useForm({
        target: 'balance',
        operation: 'fund',
        amount: '',
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(adminPath(url, `users/${user.id}`));
    };

    const submitFunding = (event) => {
        event.preventDefault();
        submitFundingAction('fund');
    };

    const submitFundingAction = (operation) => {
        fundingForm.transform((data) => ({
            ...data,
            operation,
        }));

        fundingForm.post(adminPath(url, `users/${user.id}/fund`), {
            preserveScroll: true,
            onSuccess: () => fundingForm.reset('amount', 'notes'),
        });
    };

    return (
        <AdminLayout title="Edit User">
            <div className="space-y-6">
                <UserForm
                    form={form}
                    options={options}
                    heading={`Edit ${user.name}`}
                    description="Update profile data, access level, and account state."
                    submitLabel="Save Changes"
                    onSubmit={submit}
                    cancelHref={adminPath(url, 'users')}
                    showPasswordHelp
                />

                <section className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                    <div className="mb-5">
                        <h3 className="text-lg font-semibold text-slate-100">Fund Account</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Credit user balances directly from the admin panel.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <BalanceStat label="Balance" value={user.balance} />
                        <BalanceStat label="Profit Balance" value={user.profit_balance} />
                        <BalanceStat label="Holding Balance" value={user.holding_balance} />
                    </div>

                    <form onSubmit={submitFunding} className="mt-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">
                                    Fund Target <span className="text-rose-300">*</span>
                                </span>
                                <select
                                    value={fundingForm.data.target}
                                    onChange={(event) => fundingForm.setData('target', event.target.value)}
                                    className={fieldClass(fundingForm.errors.target)}
                                    required
                                >
                                    <option value="balance">Balance</option>
                                    <option value="profit_balance">Profit Balance</option>
                                    <option value="holding_balance">Holding Balance</option>
                                </select>
                                {fundingForm.errors.target && (
                                    <span className="mt-1 block text-xs text-rose-300">
                                        {fundingForm.errors.target}
                                    </span>
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
                                    value={fundingForm.data.amount}
                                    onChange={(event) => fundingForm.setData('amount', event.target.value)}
                                    className={fieldClass(fundingForm.errors.amount)}
                                    placeholder="100.00"
                                    required
                                />
                                {fundingForm.errors.amount && (
                                    <span className="mt-1 block text-xs text-rose-300">
                                        {fundingForm.errors.amount}
                                    </span>
                                )}
                            </label>

                            <label className="block md:col-span-1">
                                <span className="mb-2 block text-sm text-slate-300">Notes</span>
                                <input
                                    type="text"
                                    value={fundingForm.data.notes}
                                    onChange={(event) => fundingForm.setData('notes', event.target.value)}
                                    className={fieldClass(fundingForm.errors.notes)}
                                    placeholder="Optional audit note"
                                />
                                {fundingForm.errors.notes && (
                                    <span className="mt-1 block text-xs text-rose-300">
                                        {fundingForm.errors.notes}
                                    </span>
                                )}
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={fundingForm.processing}
                                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {fundingForm.processing ? 'Processing...' : 'Fund Account'}
                            </button>
                            <button
                                type="button"
                                onClick={() => submitFundingAction('deduct')}
                                disabled={fundingForm.processing}
                                className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {fundingForm.processing ? 'Processing...' : 'Deduct'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AdminLayout>
    );
}

function BalanceStat({ label, value }) {
    return (
        <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{money(value)}</p>
        </article>
    );
}

const fieldClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
        hasError
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-100 focus:border-rose-400'
            : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-cyan-400'
    }`;
