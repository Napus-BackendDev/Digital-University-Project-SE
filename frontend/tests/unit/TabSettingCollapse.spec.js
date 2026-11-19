import Vue from 'vue';
import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { isSettingSectionUsed, buildSettingSectionSummary } from '@/projects/utils/formPolicy';

jest.doMock('vue-select/dist/vue-select.css', () => ({}));
const TabSetting = require('@/projects/components/Tabs/TabSetting.vue').default;

const localVue = createLocalVue();
localVue.use(Vuex);

const childStubs = {
    FormStatus: { props: ['settings', 'embedded'], template: '<div data-section="status" :data-embedded="String(embedded)" />' },
    AccessControl: { props: ['settings', 'embedded'], template: '<div data-section="access" :data-embedded="String(embedded)" />' },
    OrganizationControl: { props: ['settings', 'embedded'], template: '<div data-section="organization" :data-embedded="String(embedded)" />' },
    ResponseSettings: { props: ['settings', 'embedded'], template: '<div data-section="response" :data-embedded="String(embedded)" />' }
};

describe('TabSetting.vue collapsible setting sections & summaries', () => {
    function mountTabSetting(formDoc) {
        const store = new Vuex.Store({
            modules: {
                User: {
                    namespaced: true,
                    getters: {
                        users: () => [
                            { _id: 'u_plum', name: 'Plum Thidarat', email: 'plum@lamduan.mfu.ac.th' },
                            { _id: 'u_teo', name: 'Teerapat Sombat', email: '6631501014@lamduan.mfu.ac.th' }
                        ]
                    }
                },
                Organizations: {
                    namespaced: true,
                    getters: {
                        organizations: () => [
                            { _id: 'org_it', title: [{ key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }] }
                        ]
                    }
                },
                Roles: {
                    namespaced: true,
                    getters: {
                        roles: () => [
                            { _id: 'role_student', title: [{ key: 'th', value: 'นักศึกษา (Student)' }] }
                        ]
                    }
                },
                Setting: {
                    namespaced: true,
                    getters: { lang: () => 'th' },
                    modules: {
                        collaborator: {
                            namespaced: true,
                            getters: {
                                item: () => [
                                    { _id: 'role_edit', title: [{ key: 'th', value: 'ผู้แก้ไข' }] },
                                    { _id: 'role_view', title: [{ key: 'th', value: 'ผู้ดู' }] }
                                ]
                            }
                        }
                    }
                }
            }
        });

        const settings = Vue.observable(formDoc);
        const wrapper = shallowMount(TabSetting, {
            localVue,
            store,
            propsData: { settings },
            stubs: childStubs,
            mocks: {
                $t: (key) => {
                    const dict = {
                        'editor.settings.status.title': 'สถานะและการตั้งเวลาแบบสอบถาม',
                        'editor.settings.access.title': 'การควบคุมการเข้าถึง',
                        'editor.settings.organization.title': 'การกำหนดกลุ่มผู้ตอบตามหน่วยงาน',
                        'editor.settings.response.title': 'การตั้งค่าการตอบกลับ',
                        'editor.settings.status.modes.always.title': 'เปิดตลอดเวลา',
                        'editor.settings.status.modes.scheduled.title': 'ตั้งเวลาล่วงหน้า',
                        'editor.settings.status.draftBadge': 'แบบร่าง (ยังไม่เผยแพร่)',
                        'editor.settings.status.publishedBadge': 'เผยแพร่แล้ว',
                        'editor.settings.access.noCollaborators': 'ยังไม่มีผู้ร่วมจัดการ',
                        'editor.settings.access.viewer': 'ผู้มีสิทธิ์ดูข้อมูล',
                        'editor.settings.organization.modePrivateSummary': 'Private',
                        'editor.settings.organization.modePublicSummary': 'Public',
                        'editor.settings.organization.publicSummaryOpen': 'ทุกคนตอบได้ · ไม่จำกัดเมล มฟล.',
                        'editor.settings.organization.privateCollectEmailLockedSummary': 'เก็บอีเมล (@lamduan/@mfu)',
                        'editor.settings.response.requireLogin': 'บังคับเข้าสู่ระบบก่อนทำแบบสอบถาม',
                        'editor.settings.response.limitOne': 'จำกัดการตอบเพียง 1 ครั้ง',
                        'editor.settings.collapse.startPrefix': 'เริ่ม',
                        'editor.settings.collapse.orgPrefix': 'หน่วยงาน',
                        'editor.settings.collapse.rolePrefix': 'บทบาท',
                        'editor.settings.collapse.peoplePrefix': 'รายบุคคล',
                        'editor.settings.collapse.quotaPrefix': 'รับสูงสุด',
                        'editor.settings.collapse.noAudienceRestriction': 'ไม่จำกัดหน่วยงานหรือรายชื่อเฉพาะ',
                        'editor.settings.collapse.requireLoginOffSummary': 'ไม่บังคับล็อกอิน',
                        'editor.settings.collapse.activeCount': 'ใช้งานอยู่ {used}/{total} ส่วน',
                        'editor.settings.collapse.configuredBadge': 'ใช้งานอยู่',
                        'editor.settings.collapse.defaultBadge': 'ค่าเริ่มต้น'
                    };
                    return dict[key] || key;
                },
                $i18n: { locale: 'th' }
            }
        });

        return { wrapper, settings };
    }

    test('opens only status section by default while collapsing all other cards with live summaries', async () => {
        const { wrapper } = mountTabSetting({
            _id: 'form-1',
            schedule: { isPublished: false, mode: 'always', startAt: null, endAt: null },
            collaborator: [{ user: 'u_plum', type: 'role_view' }],
            organization: ['org_it'],
            settings: {
                allowedRoles: ['role_student'],
                allowedUser: [],
                allowedEmails: [],
                collectEmail: false,
                requireLogin: false
            }
        });

        // Only status starts open; access, organization, response start collapsed even when configured
        expect(wrapper.find('[data-test="setting-body-status"]').isVisible()).toBe(true);
        expect(wrapper.find('[data-test="setting-body-access"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-organization"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-response"]').isVisible()).toBe(false);

        // Collapsed sections immediately show selected summary chips (without the removed top toolbar)
        expect(wrapper.find('[data-test="setting-summary-access"]').text()).toContain('Plum Thidarat');
        expect(wrapper.find('[data-test="setting-summary-organization"]').text()).toContain('สำนักวิชาเทคโนโลยีสารสนเทศ');
        expect(wrapper.find('[data-test="setting-summary-response"]').text()).toContain('ไม่บังคับล็อกอิน');
        expect(wrapper.find('[data-test="settings-active-count"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="settings-expand-all"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="settings-collapse-all"]').exists()).toBe(false);

        // Collapsing status shows its summary chip cleanly
        await wrapper.find('[data-test="setting-toggle-status"]').trigger('click');
        expect(wrapper.find('[data-test="setting-body-status"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-summary-status"]').text()).toContain('เปิดตลอดเวลา');
    });

    test('keeps status section expanded on a brand-new blank form with no other active sections', () => {
        const { wrapper } = mountTabSetting({
            _id: 'form-blank',
            schedule: { isPublished: false, mode: 'always' },
            collaborator: [],
            organization: [],
            settings: {}
        });

        expect(wrapper.find('[data-test="setting-body-status"]').isVisible()).toBe(true);
        expect(wrapper.find('[data-test="setting-body-access"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-organization"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-response"]').isVisible()).toBe(false);
    });

    test('toggles section collapse and renders rich summary of chosen options when collapsed', async () => {
        const { wrapper } = mountTabSetting({
            _id: 'form-rich',
            schedule: {
                isPublished: false,
                mode: 'scheduled',
                startAt: '2026-11-25T10:30:00.000Z',
                endAt: null
            },
            collaborator: [
                { user: 'u_plum', type: 'role_view' },
                { user: { email: 'guest@gmail.com', name: 'guest@gmail.com' }, email: 'guest@gmail.com', type: 'role_edit' }
            ],
            organization: ['org_it'],
            settings: {
                allowedRoles: ['role_student'],
                allowedUser: ['u_teo'],
                allowedEmails: ['parent@gmail.com'],
                collectEmail: true,
                requireLogin: true,
                limitResponse: true,
                maxResponses: 50
            }
        });

        // Only status starts expanded; all other configured sections start collapsed showing exact summaries
        expect(wrapper.find('[data-test="setting-body-status"]').isVisible()).toBe(true);
        expect(wrapper.find('[data-test="setting-body-access"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-organization"]').isVisible()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-response"]').isVisible()).toBe(false);

        const accessSummary = wrapper.find('[data-test="setting-summary-access"]').text();
        expect(accessSummary).toContain('Plum Thidarat · ผู้มีสิทธิ์ดูข้อมูล');
        expect(accessSummary).toContain('guest@gmail.com · ผู้แก้ไข');

        const orgSummary = wrapper.find('[data-test="setting-summary-organization"]').text();
        expect(orgSummary).toContain('Private');
        expect(orgSummary).toContain('เก็บอีเมล (@lamduan/@mfu)');
        expect(orgSummary).toContain('หน่วยงาน: สำนักวิชาเทคโนโลยีสารสนเทศ');
        expect(orgSummary).toContain('บทบาท: นักศึกษา (Student)');
        expect(orgSummary).toContain('รายบุคคล: Teerapat Sombat, parent@gmail.com');

        const respSummary = wrapper.find('[data-test="setting-summary-response"]').text();
        expect(respSummary).toContain('บังคับเข้าสู่ระบบก่อนทำแบบสอบถาม');
        expect(respSummary).toContain('จำกัดการตอบเพียง 1 ครั้ง');
        expect(respSummary).toContain('รับสูงสุด: 50');

        // Collapse status too -> shows its own summary
        await wrapper.find('[data-test="setting-toggle-status"]').trigger('click');
        expect(wrapper.find('[data-test="setting-summary-status"]').text()).toContain('ตั้งเวลาล่วงหน้า');
        expect(wrapper.find('[data-test="setting-summary-status"]').text()).toContain('เริ่ม:');

        // Public mode with preserved orgs/roles/users hides Private chips in summary and marks organization section as default open
        const publicSummary = buildSettingSectionSummary('organization', {
            organization: ['org_it'],
            settings: { accessMode: 'public', allowedRoles: ['role_student'], allowedEmails: ['parent@gmail.com'] }
        }, {
            t: (k) => k === 'editor.settings.organization.modePublicSummary'
                ? 'Public'
                : (k === 'editor.settings.organization.publicSummaryOpen' ? 'ทุกคนตอบได้ · ไม่จำกัดเมล มฟล.' : k)
        });
        expect(publicSummary.map(c => c.label)).toEqual(['Public', 'ทุกคนตอบได้ · ไม่จำกัดเมล มฟล.']);
        expect(isSettingSectionUsed('organization', { organization: ['org_it'], settings: { accessMode: 'public' } })).toBe(false);
        expect(isSettingSectionUsed('response', { organization: ['org_it'], settings: { accessMode: 'private', collectEmail: true, requireLogin: false } })).toBe(false);

        // Open any collapsed section on demand by clicking its header
        await wrapper.find('[data-test="setting-toggle-organization"]').trigger('click');
        await wrapper.find('[data-test="setting-toggle-status"]').trigger('click');
        await wrapper.find('[data-test="setting-toggle-response"]').trigger('click');
        expect(wrapper.find('[data-test="setting-body-organization"]').isVisible()).toBe(true);
        expect(wrapper.find('[data-test="setting-summary-organization"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="setting-body-status"]').isVisible()).toBe(true);
        expect(wrapper.find('[data-test="setting-body-response"]').isVisible()).toBe(true);
    });

    test('pure helpers detect active usage and ignore orphan allowedRoles without organization', () => {
        expect(isSettingSectionUsed('organization', {
            organization: [],
            settings: { allowedRoles: ['role_student'], allowedUser: [], allowedEmails: [] }
        })).toBe(false);

        const summary = buildSettingSectionSummary('organization', {
            organization: [],
            settings: { allowedRoles: ['role_student'] }
        }, { t: (k) => k });
        expect(summary[0].label).toBe('editor.settings.collapse.noAudienceRestriction');
    });
});
