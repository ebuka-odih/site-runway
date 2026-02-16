import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);

const inferBaseFromAppUrl = (appUrl = '') => {
    try {
        const parsed = new URL(appUrl);
        const appPath = trimTrailingSlash(parsed.pathname || '');

        if (!appPath || appPath === '/') {
            return './';
        }

        return `${ensureLeadingSlash(appPath)}/build/`;
    } catch {
        return './';
    }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const assetUrl = trimTrailingSlash(env.ASSET_URL || process.env.ASSET_URL || '');
    const appUrl = trimTrailingSlash(env.APP_URL || process.env.APP_URL || '');
    const buildBase = assetUrl ? `${assetUrl}/build/` : inferBaseFromAppUrl(appUrl);

    return {
        base: buildBase,
        build: {
            emptyOutDir: false,
        },
        plugins: [
            react(),
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.jsx'],
                refresh: true,
            }),
            tailwindcss(),
        ],
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
