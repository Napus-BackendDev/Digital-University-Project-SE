<template>
    <CSidebar class="c-sidebar" :class="{ 'c-sidebar-minimized': sidebarMinimize }" :show="show"
        @update:show="(value) => $store.commit('set', ['sidebarShow', value])">
        <CSidebarBrand>
            <a href="/">
                <CRow>
                    <img class="pt-2 pb-2" src="@/assets/logo.svg" height="60px">
                    <CCol v-if="!sidebarMinimize" class="text-white pl-2">
                        <p class="font-weight-bold mb-0 mt-2 h5">MFU</p>
                        <p class="font-weight-bold">E-Questionaires</p>
                    </CCol>
                </CRow>
            </a>
        </CSidebarBrand>

        <CRenderFunction flat :contentToRender="navs" />

        <CSidebarFooter class="p-3">
            <div class="d-flex align-items-center justify-content-between">
                <div class="overflow-hidden">
                    <div class="font-weight-bold text-white text-truncate" style="max-width: 140px;">{{ username }}
                    </div>
                    <div v-if="userOrganization" class="text-white-50 small text-truncate"
                        style="max-width: 140px; font-weight: 500;">{{ userOrganization }}</div>
                    <div class="text-white-50 small text-truncate" style="max-width: 140px; opacity: 0.8;">{{ userEmail
                        }}</div>
                </div>
                <CDropdown placement="top-end" :caret="false">
                    <template #toggler>
                        <CButton color="ghost" variant="ghost" class="text-white mb-0 ml-2 p-1">
                            <CIcon name="cil-account-logout" />
                        </CButton>
                    </template>
                    <CDropdownHeader>{{ $t('nav.selectUser') }}</CDropdownHeader>
                    <CDropdownItem v-for="u in usersList" :key="u._id" @click="switchUser(u)">
                        {{ u.name }}
                    </CDropdownItem>
                    <CDropdownDivider v-if="usersList.length > 0" />
                    <CDropdownItem @click="logout" class="text-danger">
                        <CIcon name="cil-account-logout" class="mr-2" /> {{ $t('nav.logout') }}
                    </CDropdownItem>
                </CDropdown>
            </div>
        </CSidebarFooter>
    </CSidebar>
</template>

<script>
import api from '@/service/api';

export default {
    name: 'TheSidebar',
    data() {
        return {
            usersList: [],
        }
    },
    async created() {
        try {
            const res = await api.user('exp');
            const data = res && res.data && res.data.data;
            if (Array.isArray(data)) {
                this.usersList = data;
                if (!this.$store.state.User.user && data.length > 0) {
                    this.$store.commit('User/user', data[0]);
                }
            }
        } catch (e) {
            console.error('Failed to load user info', e);
        }
    },
    methods: {
        isActive(path) {
            const currentPath = this.$route.path.split('/')
            return currentPath.includes(path)
        },
        forms() {
            this.$router.push('/forms')
        },
        formBuilder() {
            this.$router.push('/manage')
        },
        analytics() {
            this.$router.push('/analytics')
        },
        permissions() {
            this.$router.push('/permissions')
        },
        switchUser(u) {
            this.$store.commit('User/user', u);
        },
        logout() {
            this.$router.push('/pages/login')
        },
    },
    computed: {
        navs() {
            return [{
                _name: 'CSidebarNav',
                _children: [
                    {
                        _name: 'CSidebarNavItem',
                        name: this.$t('nav.forms'),
                        to: '/forms',
                        icon: 'cil-description',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: this.$t('nav.manage'),
                        to: '/manage',
                        icon: 'cib-ghost',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: this.$t('nav.analytics'),
                        to: '/analytics',
                        icon: 'cil-chart',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: this.$t('nav.permissions'),
                        to: '/permissions',
                        icon: 'cil-lock-locked',
                    },
                ]
            }];
        },
        show() {
            return this.$store.state.sidebarShow
        },
        sidebarMinimize() {
            return this.$store.state.sidebarMinimize
        },
        user() {
            return this.$store.state.User.user || {};
        },
        username() {
            return this.user.name || this.$t('nav.selectUser');
        },
        userEmail() {
            return this.user.email || this.$t('nav.welcome');
        },
        userOrganization() {
            const org = this.user.organization;
            if (!org) return '';
            if (typeof org === 'string') return org;
            if (typeof org === 'object') {
                if (Array.isArray(org.title)) {
                    const en = org.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                    return en ? en.value : (org.title[0] ? org.title[0].value : (org.name || ''));
                }
                return org.name || org.title || '';
            }
            return '';
        }
    },
}
</script>

<style scoped>
.c-sidebar {
    background: linear-gradient(30deg, #FEC260 0%, #8c1515 60%)
}
</style>
