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
                <v-select 
                    v-model="selectedUser"
                    :options="userOptions"
                    :placeholder="$t('nav.selectUser')"
                    class="user-switcher-select"
                    :clearable="false"
                    @input="onUserSelect"
                >
                    <template #open-indicator="{ attributes }">
                        <span v-bind="attributes" class="text-white opacity-80">
                            <CIcon name="cil-account-logout" />
                        </span>
                    </template>
                    <template #selected-option>
                        <CIcon name="cil-account-logout" class="text-white" />
                    </template>
                    <template #list-footer>
                        <div class="dropdown-divider"></div>
                        <div class="px-3 py-2 text-danger logout-btn-item" @click="logout" style="cursor: pointer;">
                            <CIcon name="cil-account-logout" class="mr-2" /> {{ $t('nav.logout') }}
                        </div>
                    </template>
                </v-select>
            </div>
        </CSidebarFooter>
    </CSidebar>
</template>

<script>
import api from '@/service/api';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

export default {
    name: 'TheSidebar',
    components: {
        vSelect
    },
    data() {
        return {
            usersList: [],
            selectedUser: null
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
        onUserSelect(val) {
            if (val && val.value) {
                this.switchUser(val.value);
                // Reset selection to null so the logout icon remains visible
                this.$nextTick(() => {
                    this.selectedUser = null;
                });
            }
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
        },
        userOptions() {
            return this.usersList.map(u => ({
                label: u.name || u.email,
                value: u
            }));
        }
    },
}
</script>

<style scoped>
.c-sidebar {
    background: linear-gradient(30deg, #FEC260 0%, #8c1515 60%)
}

/* User Switcher Styling */
.user-switcher-select {
    width: 40px;
    min-width: 40px;
}

.user-switcher-select >>> .vs__dropdown-toggle {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    cursor: pointer;
}

.user-switcher-select >>> .vs__selected-options {
    display: none !important; /* Hide selected label, only show icon */
}

.user-switcher-select >>> .vs__actions {
    padding: 0 !important;
}

.user-switcher-select >>> .vs__dropdown-menu {
    background-color: #2c3e50 !important;
    border: 1px solid #34495e !important;
    color: white !important;
    min-width: 200px !important;
    bottom: 50px !important; /* Open upwards */
    top: auto !important;
    left: auto !important;
    right: 0px !important;
}

.user-switcher-select >>> .vs__dropdown-option {
    color: rgba(255, 255, 255, 0.8) !important;
    padding: 8px 12px;
}

.user-switcher-select >>> .vs__dropdown-option--highlight {
    background-color: #34495e !important;
    color: white !important;
}

.user-switcher-select >>> .vs__search {
    color: white !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 4px;
    margin: 5px !important;
    padding: 2px 8px !important;
    width: calc(100% - 10px) !important;
}

.logout-btn-item:hover {
    background-color: rgba(231, 76, 60, 0.1);
}
</style>
