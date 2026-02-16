import { Head, useForm } from '@inertiajs/react';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        form.post('/admin/login', {
            onFinish: () => form.reset('password'),
        });
    };

    return (
        <>
            <Head title="Admin Login" />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
                    <div className="absolute bottom-12 right-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-black/50 backdrop-blur">
                    <div className="mb-7 text-center">
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">RunwayAlgo</p>
                        <h1 className="mt-3 text-3xl font-semibold">Admin Console</h1>
                        <p className="mt-2 text-sm text-slate-400">Use your admin account credentials to continue.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                autoComplete="email"
                                required
                            />
                            {form.errors.email && (
                                <p className="mt-1 text-xs text-rose-300">{form.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                                autoComplete="current-password"
                                required
                            />
                            {form.errors.password && (
                                <p className="mt-1 text-xs text-rose-300">{form.errors.password}</p>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.data.remember}
                                onChange={(event) => form.setData('remember', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                            />
                            Keep me signed in
                        </label>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
