import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const defaultBrandName = 'PrologezPrime';

const getBrandName = () => {
    if (typeof document === 'undefined') {
        return defaultBrandName;
    }

    const value = document.documentElement?.dataset?.brand ?? '';
    const trimmed = value.trim();

    return trimmed || defaultBrandName;
};

createInertiaApp({
    title: (title) => {
        const brandName = getBrandName();

        return title ? `${title} - ${brandName} Admin` : `${brandName} Admin`;
    },
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#22d3ee',
    },
});
