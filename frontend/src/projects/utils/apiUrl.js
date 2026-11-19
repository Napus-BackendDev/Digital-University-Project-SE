/**
 * Helpers for exposing backend endpoints as copyable API URLs
 * (used by the "Copy API" actions that replaced JSON file downloads).
 */
export function apiBaseUrl() {
    const base = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1/';
    return base.replace(/\/?$/, '/');
}

export function buildApiUrl(path, params = {}) {
    const query = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return `${apiBaseUrl()}${String(path).replace(/^\//, '')}${query ? `?${query}` : ''}`;
}

export function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
}

function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return Promise.resolve();
}
