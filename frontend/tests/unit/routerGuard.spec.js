import { isManageRestrictedRoute } from '@/router/index';

describe('Router manage permission route guard (Requirement 5.1 / B6-2 / B7-1)', () => {
    test('identifies ManageForms, Analytics, and Email as manage-restricted routes', () => {
        expect(isManageRestrictedRoute({ name: 'ManageForms', path: '/manage' })).toBe(true);
        expect(isManageRestrictedRoute({ path: '/manage' })).toBe(true);

        expect(isManageRestrictedRoute({ name: 'Analytics', path: '/analytics' })).toBe(true);
        expect(isManageRestrictedRoute({ path: '/analytics' })).toBe(true);

        expect(isManageRestrictedRoute({ name: 'Email', path: '/email' })).toBe(true);
        expect(isManageRestrictedRoute({ path: '/email' })).toBe(true);

        expect(isManageRestrictedRoute({ name: 'EmailDetail', path: '/email/tmpl-123' })).toBe(true);
        expect(isManageRestrictedRoute({ path: '/email/tmpl-123' })).toBe(true);
    });

    test('does NOT restrict EditorCreateForm (/manage/:_id), Response (/response/:id), or AnalyticsFormReport (/analytics/:formId)', () => {
        // Invited collaborators (including students) access these via direct link
        expect(isManageRestrictedRoute({ name: 'EditorCreateForm', path: '/manage/form-123' })).toBe(false);
        expect(isManageRestrictedRoute({ name: 'Response', path: '/response/form-123' })).toBe(false);
        expect(isManageRestrictedRoute({ name: 'AnalyticsFormReport', path: '/analytics/form-123' })).toBe(false);
        expect(isManageRestrictedRoute({ path: '/analytics/form-123' })).toBe(false);
    });

    test('does NOT restrict general respondent routes (/forms, /forms/:id)', () => {
        expect(isManageRestrictedRoute({ name: 'Forms', path: '/forms' })).toBe(false);
        expect(isManageRestrictedRoute({ path: '/forms' })).toBe(false);
        expect(isManageRestrictedRoute({ name: 'FormFill', path: '/forms/form-123' })).toBe(false);
    });
});
