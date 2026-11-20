import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

jest.doMock('@/assets/logo.svg', () => 'logo.svg');
const TheSidebar = require('@/containers/TheSidebar.vue').default;

const localVue = createLocalVue();
localVue.use(Vuex);

const sidebarStubs = {
    CSidebar: { template: '<div><slot /></div>' },
    CSidebarBrand: { template: '<div><slot /></div>' },
    CSidebarFooter: { template: '<div><slot /></div>' },
    CSidebarMinimizer: { template: '<div />' },
    CIcon: { template: '<i />' },
    CRenderFunction: {
        props: ['contentToRender'],
        template: '<div class="nav-stub"><span v-for="item in (contentToRender[0] && contentToRender[0]._children || [])" :key="item.to" :data-to="item.to">{{ item.name }}</span></div>'
    },
    'router-link': { template: '<a><slot /></a>' }
};

function mountSidebarWithRole(role) {
    const store = new Vuex.Store({
        state: { sidebarShow: 'responsive', sidebarMinimize: false },
        modules: {
            User: {
                namespaced: true,
                state: {
                    user: {
                        _id: 'u-1',
                        name: 'NAPUS SAMUANPHO',
                        email: '6631503016@lamduan.mfu.ac.th',
                        role
                    }
                }
            }
        }
    });

    return shallowMount(TheSidebar, {
        localVue,
        store,
        stubs: sidebarStubs,
        mocks: {
            $t: (key) => key,
            $i18n: { locale: 'th' },
            $route: { path: '/forms', query: {} },
            $router: { push: jest.fn() }
        }
    });
}

describe('TheSidebar.vue navigation visibility (Requirement 5.1 / B6-1)', () => {
    // Note: Updated expectation from the previous isStudent check where role-less users
    // were mistakenly shown manage/analytics/email menus. Requirement 5.1 mandates
    // that create/manage menus remain hidden until explicitly assigned creator/admin role.
    test('hides manage, analytics, and email menus for Student and role-less users, showing only forms', () => {
        const studentWrapper = mountSidebarWithRole({
            title: [{ key: 'th', value: 'นักศึกษา (Student)' }, { key: 'en', value: 'Student' }]
        });
        expect(studentWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms']);

        const noRoleWrapper = mountSidebarWithRole(null);
        expect(noRoleWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms']);

        const undefinedRoleWrapper = mountSidebarWithRole(undefined);
        expect(undefinedRoleWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms']);
    });

    test('shows manage and email menus for Admin, Staff, and roles granted permission', () => {
        const adminWrapper = mountSidebarWithRole({
            title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }, { key: 'en', value: 'Admin' }]
        });
        expect(adminWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms', '/manage', '/email']);

        const staffWrapper = mountSidebarWithRole({
            title: [{ key: 'en', value: 'Staff' }]
        });
        expect(staffWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms', '/manage', '/email']);

        const studentWithMatrixWrapper = mountSidebarWithRole({
            title: [{ key: 'en', value: 'Student' }],
            permission: [{ page: 'manage', access: [{ key: 'read', value: true }] }]
        });
        expect(studentWithMatrixWrapper.findAll('.nav-stub span').wrappers.map(w => w.attributes('data-to')))
            .toEqual(['/forms', '/manage', '/email']);
    });
});
