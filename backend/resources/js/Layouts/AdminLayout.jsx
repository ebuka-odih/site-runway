import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { adminBasePath, adminPath } from '@/lib/adminPath';

export default function AdminLayout({ title, children }) {
    const { url, props } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const baseUrl = adminBasePath(url);
    const navigation = [
        { name: 'Dashboard', short: 'Home', href: adminPath(url) },
        { name: 'Transactions', short: 'Txns', href: adminPath(url, 'transactions') },
        { name: 'KYC Reviews', short: 'KYC', href: adminPath(url, 'kyc') },
        { name: 'Copy Traders', short: 'Copy', href: adminPath(url, 'copy-traders') },
        { name: 'Users', short: 'Users', href: adminPath(url, 'users') },
        { name: 'Payment Methods', short: 'Pay', href: adminPath(url, 'payment-methods') },
        { name: 'Settings', short: 'Settings', href: adminPath(url, 'settings') },
    ];

    const flashMessage = useMemo(() => {
        if (props.flash?.error) {
            return { type: 'error', text: props.flash.error };
        }

        if (props.flash?.success) {
            return { type: 'success', text: props.flash.success };
        }

        return null;
    }, [props.flash]);

    const user = props.auth?.user;
    const currentPath = String(url || '').split('#')[0].split('?')[0];

    const isActive = (href) => {
        if (href === baseUrl) {
            return currentPath === baseUrl;
        }

        return currentPath.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Head title={title} />

            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative flex min-h-screen">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-[82vw] max-w-xs border-r border-slate-800/80 bg-slate-950/95 px-5 py-6 backdrop-blur transition-transform duration-300 sm:max-w-sm lg:w-72 lg:max-w-none lg:translate-x-0 ${
                        menuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="mb-8">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">RunwayAlgo</p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Admin Console</h1>
                    </div>

                    <nav className="space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                                    isActive(item.href)
                                        ? 'bg-cyan-500/20 text-cyan-100 shadow-[0_0_20px_-8px_rgba(34,211,238,0.8)]'
                                        : 'text-slate-300 hover:bg-slate-800/70 hover:pl-5 hover:text-white'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {menuOpen && (
                    <button
                        type="button"
                        className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close sidebar"
                    />
                )}

                <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
                    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 lg:hidden"
                                    onClick={() => setMenuOpen((state) => !state)}
                                >
                                    <span className="text-lg">≡</span>
                                </button>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Admin</p>
                                    <h2 className="text-base font-semibold text-slate-100 sm:text-lg">{title}</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {user && (
                                    <div className="hidden rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 sm:block">
                                        <p className="font-semibold text-slate-100">{user.name}</p>
                                        <p>{user.email}</p>
                                    </div>
                                )}

                                <Link
                                    href={adminPath(url, 'logout')}
                                    method="post"
                                    as="button"
                                    className="rounded-xl border border-rose-500/60 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:pb-6">
                        {flashMessage && (
                            <div
                                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                                    flashMessage.type === 'error'
                                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                                }`}
                            >
                                {flashMessage.text}
                            </div>
                        )}

                        {children}
                    </main>
                </div>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur lg:hidden">
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))` }}
                >
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition ${
                                isActive(item.href)
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-slate-300 hover:bg-slate-800/80'
                            }`}
                        >
                            {item.short}
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
