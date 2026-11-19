import * as XLSX from 'xlsx';
import {
    buildAnalyticsQueryParams,
    buildAnalyticsWorkbook,
    makeUniqueSheetName,
    pickLocalizedText
} from '@/projects/utils/analyticsWorkbook';

describe('analyticsWorkbook utilities', () => {
    test('makeUniqueSheetName enforces 31-char limit, strips invalid chars, and deduplicates case-insensitively', () => {
        const used = new Set();
        const overall = makeUniqueSheetName(0, 'Overall', used);
        expect(overall).toBe('Overall');

        const s1 = makeUniqueSheetName(1, 'MFU / Survey: Part [1] * Extremely Long Title Exceeding Limit', used);
        const s2 = makeUniqueSheetName(2, 'Same Name', used);
        const s3 = makeUniqueSheetName(2, 'same name', used);

        expect(s1.length).toBeLessThanOrEqual(31);
        expect(s1).not.toMatch(/[\\/*?:[\]]/);
        expect(s2).toBe('2. Same Name');
        expect(s3).toBe('2. same name (2)');
        expect(s3.length).toBeLessThanOrEqual(31);
    });

    test('buildAnalyticsQueryParams normalizes filters cleanly', () => {
        expect(buildAnalyticsQueryParams({
            timeRange: '7d',
            orgId: 'org-1',
            status: 'Active',
            searchQuery: '  usability ',
            formIds: ['f1', 'f2'],
            userId: 'u1'
        })).toEqual({
            timeRange: '7d',
            orgId: 'org-1',
            status: 'Active',
            searchQuery: 'usability',
            formIds: 'f1,f2',
            userId: 'u1'
        });

        expect(buildAnalyticsQueryParams()).toEqual({
            timeRange: 'all',
            orgId: 'all',
            status: 'all'
        });
    });

    test('buildAnalyticsWorkbook creates clean readable Overall + per-form sheets without noisy IDs or duplicate lang rows', () => {
        const payload = {
            exportedAt: '2026-11-13T10:00:00.000Z',
            overall: {
                filters: { timeRange: 'all', orgId: 'all', status: 'all', searchQuery: '' },
                summary: {
                    totalForms: 2,
                    activeForms: 1,
                    totalTargeted: 5,
                    totalCompleted: 3,
                    totalOngoing: 1,
                    responseRate: 60,
                    avgRating: 4.5
                },
                trend: {
                    mode: 'daily',
                    labels: ['2026-11-12', '2026-11-13'],
                    completedData: [1, 2],
                    ongoingData: [0, 1]
                },
                breakdown: {
                    byOrganization: [{ id: 'org1', label: 'School of IT', target: 5, completed: 3, pending: 2, rate: 60 }],
                    byRole: [{ id: 'r1', label: 'Student', target: 5, completed: 3, pending: 2, rate: 60 }]
                }
            },
            forms: [
                {
                    form: {
                        _id: '6af5b3e1b80a4751680de68e',
                        title: { th: 'แบบสอบถามไอที', en: 'IT Usability Survey' },
                        description: { th: 'คำอธิบาย', en: 'Usability desc' },
                        status: 'Active',
                        isClosingSoon: true,
                        daysLeft: 3,
                        schedule: { startAt: '2026-11-10T00:00:00.000Z', endAt: '2026-11-16T00:00:00.000Z' },
                        organizations: ['School of IT'],
                        creator: { _id: 'c1', name: 'Creator', email: 'creator@mfu.ac.th' },
                        collaborators: []
                    },
                    summary: {
                        targetCount: 3,
                        completedCount: 2,
                        pendingCount: 1,
                        ongoingCount: 1,
                        responseRate: 66.7,
                        avgRating: 4.5,
                        ratingCount: 2
                    },
                    breakdown: {
                        byOrganization: [{ id: 'org1', label: 'School of IT', target: 3, completed: 2, pending: 1, rate: 66.7 }],
                        byRole: []
                    },
                    questions: [
                        {
                            _id: 'q1',
                            order: 1,
                            title: { en: 'Overall Rating' },
                            type: 'rating',
                            required: true,
                            stats: { answeredCount: 2, average: 4.5, min: 4, max: 5, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } }
                        },
                        {
                            _id: 'q2',
                            order: 2,
                            title: { en: 'Report File' },
                            type: 'file_upload',
                            required: false,
                            stats: { answeredCount: 1 }
                        }
                    ],
                    results: [
                        {
                            _id: 'u1',
                            name: 'Alice',
                            email: 'alice@mfu.ac.th',
                            organization: 'School of IT',
                            role: 'Student',
                            isTarget: true,
                            submitted: true,
                            submissionStatus: 'submitted',
                            respondentType: 'signed_in',
                            submittedAt: '2026-11-13T09:00:00.000Z',
                            updatedAt: '2026-11-13T09:00:00.000Z',
                            answers: [
                                { questionId: 'q1', value: '5' },
                                { questionId: 'q2', value: 'http://localhost:8081/uploads/forms/f1/responses/r1/report.pdf' }
                            ]
                        },
                        {
                            _id: 'u2',
                            name: 'Bob',
                            email: 'bob@mfu.ac.th',
                            organization: 'School of IT',
                            role: 'Student',
                            isTarget: true,
                            submitted: false,
                            submissionStatus: 'ongoing',
                            respondentType: 'signed_in',
                            submittedAt: null,
                            updatedAt: '2026-11-13T09:30:00.000Z',
                            answers: []
                        }
                    ]
                },
                {
                    form: {
                        _id: '6af5b3e1b80a4751680de999',
                        title: { en: 'Science Survey' },
                        description: { en: '' },
                        status: 'Closed',
                        isClosingSoon: false,
                        daysLeft: null,
                        schedule: {},
                        organizations: [],
                        creator: null,
                        collaborators: []
                    },
                    summary: { targetCount: 2, completedCount: 1, pendingCount: 1, ongoingCount: 0, responseRate: 50, avgRating: null, ratingCount: 0 },
                    breakdown: { byOrganization: [], byRole: [] },
                    questions: [],
                    results: []
                }
            ]
        };

        const wb = buildAnalyticsWorkbook(XLSX, payload, { locale: 'en' });
        expect(wb.SheetNames).toEqual(['Overall', '1. IT Usability Survey', '2. Science Survey']);

        const overallWs = wb.Sheets['Overall'];
        const overallRows = XLSX.utils.sheet_to_json(overallWs, { header: 1 });
        const flatOverall = overallRows.map((r) => r.join(' | ')).join('\n');
        expect(flatOverall).toContain('1. IT Usability Survey');
        expect(flatOverall).toContain('School of IT');
        expect(flatOverall).toContain('2026-11-13');
        expect(flatOverall).not.toContain('6af5b3e1b80a4751680de68e');
        expect(overallWs['!merges'].length).toBeGreaterThanOrEqual(3);

        const formWs = wb.Sheets['1. IT Usability Survey'];
        const formRows = XLSX.utils.sheet_to_json(formWs, { header: 1 });
        const flatForm = formRows.map((r) => r.join(' | ')).join('\n');
        expect(flatForm).toContain('Overall Rating');
        expect(flatForm).toContain('4.5 / 5');
        expect(flatForm).toContain('Submitted');
        expect(flatForm).toContain('In progress');
        expect(flatForm).toContain('http://localhost:8081/uploads/forms/f1/responses/r1/report.pdf');
        expect(flatForm).not.toContain('6af5b3e1b80a4751680de68e');
        expect(flatForm).not.toContain('Title (TH)');
        expect(flatForm).not.toContain('Respondent Type');

        const hyperlinkCells = Object.keys(formWs).filter((addr) => addr[0] !== '!' && formWs[addr] && formWs[addr].l);
        expect(hyperlinkCells.length).toBeGreaterThanOrEqual(1);
        expect(formWs[hyperlinkCells[0]].l.Target).toBe('http://localhost:8081/uploads/forms/f1/responses/r1/report.pdf');
    });

    test('single-form export produces exactly 1 sheet (no Overall tab) and multi-form produces Overall + N sheets with 4 localized statuses', () => {
        const baseForm = {
            form: {
                _id: 'form1',
                title: { en: 'Course Survey', th: 'แบบประเมินรายวิชา' },
                status: 'Active',
                schedule: {},
                organizations: []
            },
            summary: { targetCount: 4, completedCount: 1, ongoingCount: 2, pendingCount: 1 },
            breakdown: { byOrganization: [], byRole: [] },
            questions: [
                { _id: 'q1', title: { en: 'Rating' }, type: 'rating', stats: {} },
                { _id: 'q2', title: { en: 'Evidence' }, type: 'file_upload', stats: {} }
            ],
            results: [
                {
                    _id: 'u1',
                    name: 'Alice',
                    email: 'alice@mfu.ac.th',
                    submitted: true,
                    submissionStatus: 'submitted',
                    startedAt: '2026-11-10T08:00:00.000Z',
                    submittedAt: '2026-11-10T08:30:00.000Z',
                    answers: [{ questionId: 'q2', value: 'https://example.com/uploads/proof.png' }]
                },
                {
                    _id: 'u2',
                    name: 'Bob',
                    email: 'bob@mfu.ac.th',
                    submitted: false,
                    submissionStatus: 'ongoing',
                    startedAt: '2026-11-11T09:00:00.000Z',
                    submittedAt: null,
                    answers: []
                },
                {
                    _id: 'u3',
                    name: 'Carol',
                    email: 'carol@mfu.ac.th',
                    submitted: false,
                    submissionStatus: 'ongoing_closed',
                    startedAt: '2026-11-09T07:00:00.000Z',
                    submittedAt: null,
                    answers: []
                },
                {
                    _id: 'u4',
                    name: 'Dave',
                    email: 'dave@mfu.ac.th',
                    submitted: false,
                    submissionStatus: 'pending',
                    startedAt: null,
                    submittedAt: null,
                    answers: []
                }
            ]
        };

        // 1. Single form payload -> exactly 1 sheet (no 'Overall' sheet)
        const singlePayload = {
            exportedAt: '2026-11-19T00:00:00.000Z',
            forms: [baseForm]
        };
        const singleWb = buildAnalyticsWorkbook(XLSX, singlePayload, { locale: 'en' });
        expect(singleWb.SheetNames).toEqual(['Course Survey']);
        expect(singleWb.SheetNames).toHaveLength(1);
        expect(singleWb.SheetNames).not.toContain('Overall');

        const singleWs = singleWb.Sheets['Course Survey'];
        const singleRows = XLSX.utils.sheet_to_json(singleWs, { header: 1 });
        const flatSingle = singleRows.map((r) => r.join(' | ')).join('\n');
        expect(flatSingle).toContain('Start Time');
        expect(flatSingle).toContain('Submit Time');
        expect(flatSingle).toContain('Submitted');
        expect(flatSingle).toContain('In progress');
        expect(flatSingle).toContain('In progress (form closed)');
        expect(flatSingle).toContain('Not started');

        // Check clickable hyperlink on file upload in single form
        const hyperlinkCells = Object.keys(singleWs).filter((addr) => addr[0] !== '!' && singleWs[addr] && singleWs[addr].l);
        expect(hyperlinkCells.length).toBeGreaterThanOrEqual(1);
        expect(singleWs[hyperlinkCells[0]].l.Target).toBe('https://example.com/uploads/proof.png');

        // Check Thai localized statuses on single form
        const singleWbTh = buildAnalyticsWorkbook(XLSX, singlePayload, { locale: 'th' });
        expect(singleWbTh.SheetNames).toEqual(['แบบประเมินรายวิชา']);
        const singleWsTh = singleWbTh.Sheets['แบบประเมินรายวิชา'];
        const flatSingleTh = XLSX.utils.sheet_to_json(singleWsTh, { header: 1 }).map((r) => r.join(' | ')).join('\n');
        expect(flatSingleTh).toContain('ส่งแล้ว');
        expect(flatSingleTh).toContain('กำลังทำ');
        expect(flatSingleTh).toContain('ทำค้างไว้ (ฟอร์มปิดแล้ว)');
        expect(flatSingleTh).toContain('ยังไม่เริ่ม');

        // 2. Multi-form payload -> Overall + N sheets
        const multiPayload = {
            exportedAt: '2026-11-19T00:00:00.000Z',
            overall: { summary: { totalForms: 3 }, breakdown: {}, trend: {} },
            forms: [
                baseForm,
                { ...baseForm, form: { ...baseForm.form, _id: 'form2', title: { en: 'Lab Survey' } } },
                { ...baseForm, form: { ...baseForm.form, _id: 'form3', title: { en: 'Library Survey' } } }
            ]
        };
        const multiWb = buildAnalyticsWorkbook(XLSX, multiPayload, { locale: 'en' });
        expect(multiWb.SheetNames).toHaveLength(4);
        expect(multiWb.SheetNames[0]).toBe('Overall');
        expect(multiWb.SheetNames.slice(1)).toEqual(['1. Course Survey', '2. Lab Survey', '3. Library Survey']);
    });

    test('pickLocalizedText resolves string, pair, array, and object shapes', () => {
        expect(pickLocalizedText({ th: 'ไทย', en: 'English' }, 'th')).toBe('ไทย');
        expect(pickLocalizedText([{ key: 'en', value: 'Hello' }], 'en')).toBe('Hello');
        expect(pickLocalizedText({ title: [{ key: 'en', value: 'Org A' }] }, 'en')).toBe('Org A');

        // Empty active language falls back to non-empty alternate language (case-insensitive)
        expect(pickLocalizedText([
            { key: 'th', value: 'ข้อเสนอแนะเกี่ยวกับหลักสูตร' },
            { key: 'EN', value: '   ' }
        ], 'en')).toBe('ข้อเสนอแนะเกี่ยวกับหลักสูตร');

        // Case-insensitive match on preferred locale when uppercase stored
        expect(pickLocalizedText([
            { key: 'TH', value: 'ภาษาไทย' },
            { key: 'EN', value: 'English' }
        ], 'th')).toBe('ภาษาไทย');

        // All empty returns empty string cleanly
        expect(pickLocalizedText([
            { key: 'th', value: '' },
            { key: 'en', value: '  ' }
        ], 'en')).toBe('');

        // Plain { th, en } pair falls back when active is empty
        expect(pickLocalizedText({ en: '', th: 'สวัสดี' }, 'en')).toBe('สวัสดี');
    });
});
