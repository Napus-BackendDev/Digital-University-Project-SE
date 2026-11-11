<template>
    <CSidebar 
        colorScheme="light" 
        class="c-sidebar" 
        :minimize="sidebarMinimize" 
        :show="show"
        @update:show="(value) => $store.commit('set', ['sidebarShow', value])"
        @update:minimize="(value) => $store.commit('set', ['sidebarMinimize', value])"
    >
        <CSidebarBrand>
            <router-link to="/forms" class="c-sidebar-brand-link text-decoration-none d-flex align-items-center justify-content-center w-100 py-2">
                <img :src="require('@/assets/logo.svg')" :height="sidebarMinimize ? '36px' : '48px'" class="brand-logo" alt="MFU Logo">
                <div class="pl-2 brand-text text-left">
                    <p class="font-weight-bold mb-0 text-dark h5 line-height-tight">MFU</p>
                    <p class="font-weight-bold text-primary small mb-0">E-Questionnaires</p>
                </div>
            </router-link>
        </CSidebarBrand>

        <CRenderFunction flat :contentToRender="navs" />

        <CSidebarFooter :class="sidebarMinimize ? 'p-1' : 'p-3'">
            <!-- Minimized compact footer -->
            <div v-if="sidebarMinimize" class="d-flex flex-column align-items-center justify-content-center w-100 py-2">
                <div 
                    class="user-avatar-mini d-flex align-items-center justify-content-center rounded-circle bg-light border text-primary overflow-hidden"
                    :title="`${username} (${userEmail})`"
                >
                    <img 
                        v-if="userPicture" 
                        :src="userPicture" 
                        alt="Avatar" 
                        class="w-100 h-100" 
                        style="object-fit: cover;"
                        referrerpolicy="no-referrer"
                    />
                    <CIcon v-else name="cil-user" />
                </div>
            </div>

            <!-- Expanded full footer -->
            <div v-else class="d-flex align-items-center w-100">
                <div class="d-flex align-items-center overflow-hidden w-100">
                    <img 
                        v-if="userPicture" 
                        :src="userPicture" 
                        alt="Avatar" 
                        class="rounded-circle mr-2 border flex-shrink-0" 
                        style="width: 38px; height: 38px; object-fit: cover;"
                        referrerpolicy="no-referrer"
                    />
                    <div class="overflow-hidden">
                        <div class="font-weight-bold text-dark text-truncate" style="max-width: 170px;">{{ username }}</div>
                        <div v-if="userOrganization" class="text-muted small text-truncate" style="max-width: 170px; font-weight: 500;">{{ userOrganization }}</div>
                        <div class="text-muted small text-truncate" style="max-width: 170px; opacity: 0.85;">{{ userEmail }}</div>
                    </div>
                </div>
            </div>
        </CSidebarFooter>
        <CSidebarMinimizer class="d-md-down-none" @click.native="$store.commit('toggle', 'sidebarMinimize')"/>
    </CSidebar>
</template>

<script>
import api from '@/service/api';

export default {
    name: 'TheSidebar',
    data() {
        return {}
    },
    async created() {
        const isDevEnv = (process.env.VUE_APP_APP_ENV || 'production').toLowerCase() === 'developer';
        const savedUserId = (isDevEnv && this.$route?.query?.switchUser) || window.localStorage.getItem('activeUserId');
        if (savedUserId && (!this.$store.state.User || !this.$store.state.User.user)) {
            try {
                await this.$store.dispatch('User/get', { _id: savedUserId });
            } catch (e) {
                console.error('Failed to load user info', e);
            }
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
        logout() {
            window.localStorage.removeItem('activeUserId');
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
                        name: this.$t('nav.email'),
                        to: '/email',
                        icon: 'cil-envelope-open',
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
        userPicture() {
            return this.user.picture || null;
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
    background-color: #ffffff !important;
    background-image: none !important;
    border-right: 1px solid #e2e8f0 !important;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04) !important;
    display: flex !important;
    flex-direction: column !important;
    width: 256px !important;
    min-width: 256px !important;
    max-width: 256px !important;
    flex: 0 0 256px !important;
    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                min-width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                max-width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                flex 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                margin-left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* Ensure nav does not squash footer */
.c-sidebar >>> .c-sidebar-nav {
    height: auto !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* Minimized sidebar constraints */
.c-sidebar.c-sidebar-minimized {
    width: 56px !important;
    min-width: 56px !important;
    max-width: 56px !important;
    flex: 0 0 56px !important;
}

.c-sidebar.c-sidebar-minimized >>> .c-sidebar-brand {
    width: 56px !important;
    height: 56px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.c-sidebar.c-sidebar-minimized >>> .c-sidebar-brand .brand-text {
    max-width: 0 !important;
    opacity: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: none;
}

/* Overriding CoreUI's hidden footer in minimized mode */
.c-sidebar.c-sidebar-minimized >>> .c-sidebar-footer {
    height: auto !important;
    min-height: 52px !important;
    padding: 6px 2px !important;
    margin: 0 !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #ffffff !important;
    border-top: 1px solid #f1f5f9 !important;
}

.c-sidebar >>> .c-sidebar-footer {
    background-color: #ffffff !important;
    border-top: 1px solid #f1f5f9 !important;
    flex: 0 0 auto !important;
    overflow: hidden !important;
    transition: padding 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* Modern sleek minimizer button */
.c-sidebar >>> .c-sidebar-minimizer {
    background-color: #ffffff !important;
    border: none !important;
    border-top: 1px solid #f1f5f9 !important;
    color: #64748b !important;
    height: 44px !important;
    min-height: 44px !important;
    flex: 0 0 44px !important;
    position: relative !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    padding-right: 16px !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.c-sidebar >>> .c-sidebar-minimizer::before {
    background-size: 11px auto !important;
    opacity: 0.55 !important;
    transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.c-sidebar >>> .c-sidebar-minimizer:hover {
    background-color: #f8fafc !important;
    color: #0f172a !important;
}

.c-sidebar >>> .c-sidebar-minimizer:hover::before {
    opacity: 0.9 !important;
}

.c-sidebar.c-sidebar-minimized >>> .c-sidebar-minimizer {
    width: 56px !important;
    justify-content: center !important;
    padding-right: 0 !important;
}

.c-sidebar.c-sidebar-minimized >>> .c-sidebar-minimizer::before {
    width: 100% !important;
    margin: 0 auto !important;
}

.c-sidebar-brand-link {
    overflow: hidden;
    white-space: nowrap;
    transition: all 0.3s ease;
}

.brand-logo {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    object-fit: contain;
}

.brand-text {
    max-width: 160px;
    opacity: 1;
    overflow: hidden;
    white-space: nowrap;
    transition: max-width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                opacity 0.2s ease,
                padding 0.3s ease;
}

.line-height-tight {
    line-height: 1.2;
}

.user-avatar-mini {
    width: 34px;
    height: 34px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.user-avatar-mini:hover {
    background-color: #f1f5f9 !important;
}
</style>