import * as XLSX from 'xlsx';
import {
    getBackendOrigin,
    resolveExportUrl,
    formatExportAnswerValue,
    applySheetHyperlinks
} from '@/projects/utils/exportFileUrl';

describe('exportFileUrl helpers', () => {
    test('resolveExportUrl prepends localhost backend origin to /uploads paths and encodes spaces', () => {
        const origin = getBackendOrigin();
        expect(origin).toMatch(/^https?:\/\//);

        const pdfPath = '/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf';
        expect(resolveExportUrl(pdfPath, 'http://localhost:8081')).toBe(
            'http://localhost:8081/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf'
        );
        expect(resolveExportUrl('uploads/forms/abc/test file.pdf', 'http://localhost:8081/')).toBe(
            'http://localhost:8081/uploads/forms/abc/test%20file.pdf'
        );
        expect(resolveExportUrl('https://cdn.example.com/file.pdf', 'http://localhost:8081')).toBe(
            'https://cdn.example.com/file.pdf'
        );
    });

    test('formatExportAnswerValue parses JSON-stringified upload arrays into clean URL strings', () => {
        const rawJsonArray = '["/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf"]';
        expect(formatExportAnswerValue(rawJsonArray, { origin: 'http://localhost:8081' })).toBe(
            'http://localhost:8081/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf'
        );

        expect(formatExportAnswerValue(
            ['/uploads/forms/f1/a.pdf', { path: '/uploads/forms/f1/b.png' }],
            { origin: 'http://localhost:8081' }
        )).toBe('http://localhost:8081/uploads/forms/f1/a.pdf, http://localhost:8081/uploads/forms/f1/b.png');

        expect(formatExportAnswerValue('Plain text response', { origin: 'http://localhost:8081' })).toBe('Plain text response');
        expect(formatExportAnswerValue(null)).toBe('');
    });

    test('applySheetHyperlinks adds Excel cell.l hyperlinks to URL cells without altering plain cells', () => {
        const url = 'http://localhost:8081/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf';
        const ws = applySheetHyperlinks(XLSX.utils.aoa_to_sheet([
            ['Responder', 'Attachment'],
            ['Thanakorn', url],
            ['Alice', 'No file']
        ]));

        expect(ws.B2.v).toBe(url);
        expect(ws.B2.l).toEqual({ Target: url, Tooltip: url });
        expect(ws.A2.l).toBeUndefined();
        expect(ws.B3.l).toBeUndefined();
    });
});
