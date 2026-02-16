import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const assetUrl = trimTrailingSlash(env.ASSET_URL || process.env.ASSET_URL || '');
    const buildBase = assetUrl ? `${assetUrl}/build/` : '/build/';

    return {
        base: buildBase,
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
