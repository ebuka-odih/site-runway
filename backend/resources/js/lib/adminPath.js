const ADMIN_SEGMENT = '/admin';

const stripQueryAndHash = (value = '') => value.split('#')[0].split('?')[0];

export function adminBasePath(currentUrl = '') {
    const cleanUrl = stripQueryAndHash(String(currentUrl || ''));
    const index = cleanUrl.indexOf(ADMIN_SEGMENT);

    if (index === -1) {
        return ADMIN_SEGMENT;
    }

    return cleanUrl.slice(0, index + ADMIN_SEGMENT.length) || ADMIN_SEGMENT;
}

export function adminPath(currentUrl = '', suffix = '') {
    const base = adminBasePath(currentUrl).replace(/\/+$/, '');
    const cleanedSuffix = String(suffix || '').replace(/^\/+/, '');

    return cleanedSuffix ? `${base}/${cleanedSuffix}` : base;
}

