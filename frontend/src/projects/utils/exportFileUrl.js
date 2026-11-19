export function getBackendOrigin() {
    const apiBase = (typeof process !== 'undefined' && process.env && process.env.VUE_APP_API_BASE_URL)
        || 'http://localhost:8081/api/v1/';
    return String(apiBase).replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
}

export function parseStructuredAnswer(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
            return JSON.parse(trimmed);
        } catch (_) {
            return value;
        }
    }
    return value;
}

export function resolveExportUrl(value, origin = getBackendOrigin()) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed.replace(/ /g, '%20');

    const normalized = trimmed.replace(/\\/g, '/');
    if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
        const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
        const cleanOrigin = String(origin || getBackendOrigin()).replace(/\/+$/, '');
        return `${cleanOrigin}${cleanPath}`.replace(/ /g, '%20');
    }
    return trimmed;
}

/**
 * Normalizes exported answer values (including JSON-stringified file upload arrays/objects)
 * and prepends the backend origin to `/uploads/...` paths so links open directly.
 */
export function formatExportAnswerValue(rawValue, { origin = getBackendOrigin(), asArray = false } = {}) {
    if (rawValue === null || rawValue === undefined) return asArray ? [] : '';
    const parsed = parseStructuredAnswer(rawValue);

    const normalizeItem = (entry) => {
        if (entry === null || entry === undefined) return '';
        if (typeof entry === 'object') {
            const fileRef = entry.url || entry.path || entry.name;
            return fileRef ? resolveExportUrl(String(fileRef), origin) : JSON.stringify(entry);
        }
        return resolveExportUrl(String(entry), origin);
    };

    if (Array.isArray(parsed)) {
        const items = parsed.map(normalizeItem).filter(Boolean);
        return asArray ? items : items.join(', ');
    }

    const single = normalizeItem(parsed);
    if (asArray) return single ? [single] : [];
    return single;
}

/**
 * Attaches clickable Excel hyperlinks (`cell.l`) to worksheet string cells containing http(s) URLs.
 */
export function applySheetHyperlinks(worksheet) {
    if (!worksheet || typeof worksheet !== 'object') return worksheet;
    Object.keys(worksheet).forEach((cellRef) => {
        if (cellRef.startsWith('!')) return;
        const cell = worksheet[cellRef];
        if (!cell || typeof cell.v !== 'string') return;
        const match = cell.v.match(/https?:\/\/[^\s,]+/);
        if (match && match[0]) {
            cell.l = { Target: match[0], Tooltip: match[0] };
        }
    });
    return worksheet;
}
