import { applySheetHyperlinks, formatExportAnswerValue } from '@/projects/utils/exportFileUrl';

const EXCEL_SHEET_MAX_LEN = 31;
const INVALID_SHEET_CHARS = /[\\/*?:[\]]/g;

/**
 * Pick localized text from a string, `{ th, en }` pair, `[{ key, value }]` array, or `{ title/name/email }` object.
 */
export function pickLocalizedText(val, locale = 'en') {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return String(val).trim();
    }

    const normLocale = String(locale || 'en').trim().toLowerCase() || 'en';
    const hasText = (v) => v !== null && v !== undefined && typeof v !== 'object' && String(v).trim().length > 0;

    if (Array.isArray(val)) {
        const findNonEmptyByKey = (targetKey) => val.find(
            (item) => item && item.key && String(item.key).trim().toLowerCase() === targetKey && hasText(item.value)
        );
        const preferred = findNonEmptyByKey(normLocale)
            || findNonEmptyByKey('en')
            || findNonEmptyByKey('th')
            || val.find((item) => item && hasText(item.value));
        return preferred ? String(preferred.value).trim() : '';
    }

    if (typeof val === 'object') {
        if (val.key !== undefined && val.value !== undefined) {
            return hasText(val.value) ? String(val.value).trim() : '';
        }
        const entries = Object.entries(val);
        const findObjValue = (targetKey) => {
            const match = entries.find(([k, v]) => k && k.trim().toLowerCase() === targetKey && hasText(v));
            return match ? String(match[1]).trim() : '';
        };
        const direct = findObjValue(normLocale) || findObjValue('en') || findObjValue('th');
        if (direct) return direct;

        return (
            pickLocalizedText(val.title, normLocale)
            || pickLocalizedText(val.name, normLocale)
            || pickLocalizedText(val.label, normLocale)
            || (hasText(val.email) ? String(val.email).trim() : '')
        );
    }
    return '';
}

/**
 * Build an Excel-safe unique worksheet name (<= 31 chars, stripped of invalid characters, case-insensitively deduplicated).
 */
export function makeUniqueSheetName(index, title, usedNames = new Set()) {
    const cleaned = String(title || '')
        .replace(INVALID_SHEET_CHARS, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^'+|'+$/g, '')
        .trim();

    const baseTitle = cleaned || `Form ${index}`;
    const prefix = index > 0 ? `${index}. ` : '';

    const reserveCandidate = (candidate) => {
        const normalized = candidate.slice(0, EXCEL_SHEET_MAX_LEN).replace(/^'+|'+$/g, '').trim() || `Sheet ${index || 1}`;
        const lower = normalized.toLowerCase();
        if (!usedNames.has(lower)) {
            usedNames.add(lower);
            return normalized;
        }
        return null;
    };

    const initial = reserveCandidate(`${prefix}${baseTitle}`.slice(0, EXCEL_SHEET_MAX_LEN));
    if (initial) return initial;

    let counter = 2;
    while (counter < 1000) {
        const suffix = ` (${counter})`;
        const headBudget = Math.max(1, EXCEL_SHEET_MAX_LEN - prefix.length - suffix.length);
        const attempt = `${prefix}${baseTitle.slice(0, headBudget).trim()}${suffix}`;
        const picked = reserveCandidate(attempt);
        if (picked) return picked;
        counter += 1;
    }

    return `Sheet_${index}_${Date.now()}`.slice(0, EXCEL_SHEET_MAX_LEN);
}

/**
 * Normalize filter inputs into query parameters accepted by `GET /api/v1/analytics/export`.
 */
export function buildAnalyticsQueryParams({
    timeRange = 'all',
    orgId = 'all',
    status = 'all',
    searchQuery = '',
    formIds = [],
    userId = ''
} = {}) {
    const params = {
        timeRange: timeRange || 'all',
        orgId: orgId || 'all',
        status: status || 'all'
    };
    const trimmedSearch = String(searchQuery || '').trim();
    if (trimmedSearch) params.searchQuery = trimmedSearch;

    if (Array.isArray(formIds) && formIds.length > 0) {
        const joined = formIds.map((id) => String(id || '').trim()).filter(Boolean).join(',');
        if (joined) params.formIds = joined;
    } else if (typeof formIds === 'string' && formIds.trim()) {
        params.formIds = formIds.trim();
    }

    if (userId && String(userId).trim()) {
        params.userId = String(userId).trim();
    }
    return params;
}

function formatDateDisplay(val, includeTime = true) {
    if (!val) return '-';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (!includeTime) return `${dd}/${mm}/${yyyy}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatScheduleRange(schedule) {
    if (!schedule || (!schedule.startAt && !schedule.endAt)) return '-';
    const start = schedule.startAt ? formatDateDisplay(schedule.startAt, false) : 'Open';
    const end = schedule.endAt ? formatDateDisplay(schedule.endAt, false) : 'No end date';
    return `${start} – ${end}`;
}

function formatSubmissionStatus(entry, locale = 'en') {
    const raw = String((entry && entry.submissionStatus) || (entry && entry.submitted ? 'submitted' : 'pending')).toLowerCase();
    const isTh = String(locale || 'en').toLowerCase().startsWith('th');

    if (raw === 'submitted' || raw === 'completed') {
        return isTh ? 'ส่งแล้ว' : 'Submitted';
    }
    if (raw === 'ongoing' || raw === 'in_progress' || raw === 'in progress') {
        return isTh ? 'กำลังทำ' : 'In progress';
    }
    if (raw === 'ongoing_closed' || raw === 'in_progress_closed' || raw === 'in progress (form closed)') {
        return isTh ? 'ทำค้างไว้ (ฟอร์มปิดแล้ว)' : 'In progress (form closed)';
    }
    return isTh ? 'ยังไม่เริ่ม' : 'Not started';
}

function formatQuestionTypeLabel(qType) {
    const raw = String(qType || '').trim().toLowerCase();
    if (!raw) return '-';
    if (raw === 'rating') return 'Rating';
    if (raw === 'multiple_choice' || raw === 'multiple choice') return 'Multiple Choice';
    if (raw === 'checkbox') return 'Checkbox';
    if (raw === 'free_text' || raw === 'free text' || raw === 'short_answer' || raw === 'short answer' || raw === 'paragraph' || raw === 'short' || raw === 'text') return 'Free Text';
    if (raw === 'file_upload' || raw === 'file upload') return 'File Upload';
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatQuestionStatsSummary(q, locale) {
    const stats = (q && q.stats) || {};
    const qType = String((q && q.type) || '').toLowerCase();

    if (qType === 'rating') {
        const dist = stats.distribution || {};
        const nonZeroStars = [5, 4, 3, 2, 1]
            .filter((s) => (dist[s] || 0) > 0)
            .map((s) => `${s}★: ${dist[s]}`)
            .join(' | ');
        const avgText = stats.average !== null && stats.average !== undefined ? `${stats.average} / 5` : '-';
        const rangeText = stats.min !== null && stats.min !== undefined ? `Min ${stats.min}–Max ${stats.max}` : '';
        const detail = [rangeText, nonZeroStars].filter(Boolean).join(' | ') || '-';
        return {
            primaryMetric: avgText,
            detail
        };
    }

    if (Array.isArray(stats.options) && stats.options.length > 0) {
        const detail = stats.options
            .map((opt) => `${pickLocalizedText(opt.label, locale) || opt.key}: ${opt.count} (${opt.percentage}%)`)
            .join(' | ');
        return {
            primaryMetric: stats.topOption || '-',
            detail: detail || '-'
        };
    }

    return {
        primaryMetric: `${stats.answeredCount || 0} answered`,
        detail: '-'
    };
}

function applySheetLayout(ws, aoa = [], bannerRowIndexes = [], tableHeaderRowIndexes = []) {
    const maxCols = aoa.reduce((max, row) => (Array.isArray(row) && row.length > max ? row.length : max), 1);
    const bannerSet = new Set(bannerRowIndexes);
    const headerSet = new Set(tableHeaderRowIndexes);

    // Merge title & section banner rows across visible table width so Col A stays proportional
    const merges = [];
    bannerRowIndexes.forEach((rIdx) => {
        const span = Math.min(Math.max(maxCols - 1, 3), 7);
        if (span >= 1) {
            merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: span } });
        }
    });
    if (merges.length > 0) {
        ws['!merges'] = merges;
    }

    // Auto-size columns from actual data/header rows (excluding wide merged banner titles)
    const colWidths = [];
    aoa.forEach((row, rIdx) => {
        if (!Array.isArray(row) || bannerSet.has(rIdx)) return;
        row.forEach((cell, cIdx) => {
            const text = cell === null || cell === undefined ? '' : String(cell);
            const firstLineLen = text.split(/\r?\n/)[0].length;
            const padded = Math.min(44, Math.max(10, firstLineLen + 3));
            if (!colWidths[cIdx] || padded > colWidths[cIdx]) {
                colWidths[cIdx] = padded;
            }
        });
    });
    ws['!cols'] = colWidths.map((wch) => ({ wch }));

    // Add comfortable row heights for banners and table headers
    ws['!rows'] = aoa.map((row, rIdx) => {
        if (rIdx === 0) return { hpt: 26 };
        if (bannerSet.has(rIdx)) return { hpt: 22 };
        if (headerSet.has(rIdx)) return { hpt: 21 };
        if (!Array.isArray(row) || row.length === 0) return { hpt: 12 };
        return { hpt: 19 };
    });
}

function buildOverallSheetRows(payload, formSheetNames, locale) {
    const overall = payload.overall || {};
    const filters = overall.filters || {};
    const summary = overall.summary || {};
    const trend = overall.trend || {};
    const breakdown = overall.breakdown || { byOrganization: [], byRole: [] };
    const forms = Array.isArray(payload.forms) ? payload.forms : [];

    const activeFilterParts = [];
    if (filters.timeRange && filters.timeRange !== 'all') activeFilterParts.push(`Period: ${filters.timeRange}`);
    if (filters.orgId && filters.orgId !== 'all') activeFilterParts.push(`Organization: ${filters.orgId}`);
    if (filters.status && filters.status !== 'all') activeFilterParts.push(`Status: ${filters.status}`);
    if (filters.searchQuery) activeFilterParts.push(`Search: "${filters.searchQuery}"`);

    const bannerRows = [0];
    const headerRows = [];
    const rows = [
        ['MFU E-Questionnaires — Analytics Report (Overall)'],
        ['Exported', formatDateDisplay(payload.exportedAt), ...(activeFilterParts.length ? [`Filters: ${activeFilterParts.join(' | ')}`] : [])],
        []
    ];

    bannerRows.push(rows.length);
    rows.push(['1. Overall Summary']);
    headerRows.push(rows.length);
    rows.push(['Total Forms', 'Active Forms', 'Targeted Members', 'Completed', 'Ongoing Drafts', 'Response Rate (%)', 'Avg Rating']);
    rows.push([
        summary.totalForms ?? forms.length,
        summary.activeForms ?? 0,
        summary.totalTargeted ?? 0,
        summary.totalCompleted ?? 0,
        summary.totalOngoing ?? 0,
        summary.responseRate ?? 0,
        summary.avgRating !== null && summary.avgRating !== undefined ? `${summary.avgRating} / 5` : '-'
    ]);
    rows.push([]);

    bannerRows.push(rows.length);
    rows.push(['2. Forms Overview']);
    headerRows.push(rows.length);
    rows.push(['Sheet Tab', 'Form Title', 'Status', 'Target', 'Completed', 'Ongoing', 'Response Rate (%)', 'Avg Rating']);
    forms.forEach((fp, idx) => {
        const f = fp.form || {};
        const s = fp.summary || {};
        rows.push([
            formSheetNames[idx] || '-',
            pickLocalizedText(f.title, locale) || pickLocalizedText(f.title, 'en') || pickLocalizedText(f.title, 'th') || '-',
            f.status || '-',
            s.targetCount ?? 0,
            s.completedCount ?? 0,
            s.ongoingCount ?? 0,
            s.responseRate !== null && s.responseRate !== undefined ? s.responseRate : '-',
            s.avgRating !== null && s.avgRating !== undefined ? s.avgRating : '-'
        ]);
    });

    const orgList = breakdown.byOrganization || [];
    const roleList = breakdown.byRole || [];
    if (orgList.length > 0 || roleList.length > 0) {
        rows.push([]);
        bannerRows.push(rows.length);
        rows.push(['3. Participation by Organization & Role']);
        headerRows.push(rows.length);
        rows.push(['Group Type', 'Name', 'Targeted', 'Completed', 'Participation Rate (%)']);
        orgList.forEach((item) => {
            rows.push(['Organization', item.label || item.id, item.target ?? 0, item.completed ?? 0, item.rate ?? 0]);
        });
        roleList.forEach((item) => {
            rows.push(['Role', item.label || item.id, item.target ?? 0, item.completed ?? 0, item.rate ?? 0]);
        });
    }

    const trendLabels = Array.isArray(trend.labels) ? trend.labels : [];
    const completedSeries = trend.completedData || trend.completed || [];
    const ongoingSeries = trend.ongoingData || trend.ongoing || [];
    const nonEmptyTrend = trendLabels
        .map((label, idx) => ({ label, completed: completedSeries[idx] || 0, ongoing: ongoingSeries[idx] || 0 }))
        .filter((pt) => pt.completed > 0 || pt.ongoing > 0);
    if (nonEmptyTrend.length > 0) {
        const sectionNum = (orgList.length > 0 || roleList.length > 0) ? 4 : 3;
        rows.push([]);
        bannerRows.push(rows.length);
        rows.push([`${sectionNum}. Response Activity Trend`]);
        headerRows.push(rows.length);
        rows.push(['Period', 'Completed', 'Ongoing Drafts']);
        nonEmptyTrend.forEach((pt) => {
            rows.push([pt.label, pt.completed, pt.ongoing]);
        });
    }

    return { rows, bannerRows, headerRows };
}

function buildPerFormSheetRows(formPayload, locale) {
    const f = formPayload.form || {};
    const s = formPayload.summary || {};
    const breakdown = formPayload.breakdown || { byOrganization: [], byRole: [] };
    const questions = Array.isArray(formPayload.questions) ? formPayload.questions : [];
    const results = Array.isArray(formPayload.results) ? formPayload.results : [];

    const titleText = pickLocalizedText(f.title, locale) || pickLocalizedText(f.title, 'en') || pickLocalizedText(f.title, 'th') || '-';
    const descText = pickLocalizedText(f.description, locale) || pickLocalizedText(f.description, 'en') || pickLocalizedText(f.description, 'th');
    const orgListText = Array.isArray(f.organizations) && f.organizations.length > 0
        ? f.organizations.map((o) => pickLocalizedText(o, locale) || o).filter(Boolean).join(', ')
        : '-';
    const statusText = `${f.status || '-'}${f.isClosingSoon && f.daysLeft !== null ? ` (${f.daysLeft}d left)` : ''}`;

    const bannerRows = [0];
    const headerRows = [];
    const rows = [
        [titleText]
    ];
    if (descText) rows.push(['Description', descText]);
    rows.push(['Status', statusText, 'Schedule', formatScheduleRange(f.schedule), 'Access', orgListText]);
    rows.push([]);

    let secNum = 1;
    bannerRows.push(rows.length);
    rows.push([`${secNum}. Summary`]);
    headerRows.push(rows.length);
    rows.push(['Targeted', 'Completed', 'Ongoing Drafts', 'Response Rate (%)', 'Average Rating']);
    rows.push([
        s.targetCount ?? 0,
        s.completedCount ?? 0,
        s.ongoingCount ?? 0,
        s.responseRate !== null && s.responseRate !== undefined ? s.responseRate : '-',
        s.avgRating !== null && s.avgRating !== undefined ? `${s.avgRating} / 5 (${s.ratingCount || 0})` : '-'
    ]);

    const orgList = breakdown.byOrganization || [];
    const roleList = breakdown.byRole || [];
    if (orgList.length > 0 || roleList.length > 0) {
        secNum += 1;
        rows.push([]);
        bannerRows.push(rows.length);
        rows.push([`${secNum}. Participation by Organization & Role`]);
        headerRows.push(rows.length);
        rows.push(['Group Type', 'Name', 'Targeted', 'Completed', 'Participation Rate (%)']);
        orgList.forEach((item) => {
            rows.push(['Organization', item.label || item.id, item.target ?? 0, item.completed ?? 0, item.rate ?? 0]);
        });
        roleList.forEach((item) => {
            rows.push(['Role', item.label || item.id, item.target ?? 0, item.completed ?? 0, item.rate ?? 0]);
        });
    }

    if (questions.length > 0) {
        secNum += 1;
        rows.push([]);
        bannerRows.push(rows.length);
        rows.push([`${secNum}. Question Summary`]);
        headerRows.push(rows.length);
        rows.push(['#', 'Question', 'Type', 'Answered', 'Avg / Top Choice', 'Breakdown']);
        questions.forEach((q, idx) => {
            const formatted = formatQuestionStatsSummary(q, locale);
            rows.push([
                idx + 1,
                pickLocalizedText(q.title, locale) || pickLocalizedText(q.title, 'en') || pickLocalizedText(q.title, 'th') || `Question ${idx + 1}`,
                formatQuestionTypeLabel(q.type),
                (q.stats && q.stats.answeredCount) ?? 0,
                formatted.primaryMetric,
                formatted.detail
            ]);
        });
    }

    secNum += 1;
    rows.push([]);
    bannerRows.push(rows.length);
    rows.push([`${secNum}. Individual Responses`]);

    const questionHeaders = questions.map((q, idx) => {
        const qTitle = pickLocalizedText(q.title, locale) || pickLocalizedText(q.title, 'en') || pickLocalizedText(q.title, 'th') || `Q${idx + 1}`;
        return `Q${idx + 1}: ${qTitle}`;
    });

    headerRows.push(rows.length);
    rows.push(['Status', 'Name', 'Email', 'Organization', 'Role', 'Start Time', 'Submit Time', ...questionHeaders]);

    results.forEach((entry) => {
        const answerMap = new Map();
        (Array.isArray(entry.answers) ? entry.answers : []).forEach((ans) => {
            const qid = ans && (ans.questionId || ans.question);
            if (qid) {
                answerMap.set(String(qid), formatExportAnswerValue(ans.value));
            }
        });

        const questionCells = questions.map((q) => {
            const val = answerMap.get(String(q._id));
            return val !== undefined && val !== '' ? val : '-';
        });

        const startedDisplay = formatDateDisplay(entry.startedAt || entry.createdAt || (entry.submitted ? entry.submittedAt : null));
        const submittedDisplay = formatDateDisplay(entry.submittedAt || (entry.submitted ? entry.updatedAt : null));

        rows.push([
            formatSubmissionStatus(entry, locale),
            entry.name || (entry.respondentType === 'guest' ? 'Anonymous' : '-'),
            entry.email || '-',
            pickLocalizedText(entry.organization, locale) || entry.organization || '-',
            pickLocalizedText(entry.role, locale) || entry.role || '-',
            startedDisplay,
            submittedDisplay,
            ...questionCells
        ]);
    });

    return { rows, bannerRows, headerRows };
}

/**
 * Construct a clean multi-sheet XLSX workbook (`Overall` + 1 dedicated sheet per form) with clickable upload hyperlinks.
 * When payload contains exactly ONE form, the "Overall" sheet is omitted and only that form's sheet is exported.
 */
export function buildAnalyticsWorkbook(XLSX, payload, { locale = 'en' } = {}) {
    const wb = XLSX.utils.book_new();
    const usedNames = new Set();
    const forms = Array.isArray(payload && payload.forms) ? payload.forms : [];

    const isSingleForm = forms.length === 1;

    const formSheetNames = forms.map((fp, idx) => {
        const f = fp.form || {};
        const title = pickLocalizedText(f.title, locale) || pickLocalizedText(f.title, 'en') || pickLocalizedText(f.title, 'th') || `Form ${idx + 1}`;
        return makeUniqueSheetName(isSingleForm ? 0 : idx + 1, title, usedNames);
    });

    if (!isSingleForm) {
        const overallTab = makeUniqueSheetName(0, 'Overall', usedNames);
        const overallBuilt = buildOverallSheetRows(payload || {}, formSheetNames, locale);
        const overallWs = XLSX.utils.aoa_to_sheet(overallBuilt.rows);
        applySheetLayout(overallWs, overallBuilt.rows, overallBuilt.bannerRows, overallBuilt.headerRows);
        XLSX.utils.book_append_sheet(wb, overallWs, overallTab);
    }

    forms.forEach((fp, idx) => {
        const sheetName = formSheetNames[idx];
        const formBuilt = buildPerFormSheetRows(fp, locale);
        const formWs = XLSX.utils.aoa_to_sheet(formBuilt.rows);
        applySheetLayout(formWs, formBuilt.rows, formBuilt.bannerRows, formBuilt.headerRows);
        applySheetHyperlinks(formWs);
        XLSX.utils.book_append_sheet(wb, formWs, sheetName);
    });

    return wb;
}

export function buildSafeFormFilename(formName = 'Form') {
    const slug = String(formName || 'Form')
        .replace(/[^\w\u0E00-\u0E7F-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40);
    return `MFU_${slug || 'Form'}`;
}

export function downloadAnalyticsWorkbookFile(XLSX, payload, { locale = 'en', filePrefix = 'MFU_Analytics', stamp = '' } = {}) {
    const forms = (payload && payload.forms) || [];
    if (!forms.length) return false;
    const wb = buildAnalyticsWorkbook(XLSX, payload, { locale });
    const suffix = stamp ? `_${stamp}` : '';
    XLSX.writeFile(wb, `${filePrefix}${suffix}.xlsx`);
    return true;
}
