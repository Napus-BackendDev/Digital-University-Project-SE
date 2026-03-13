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

        <CSidebarFooter class="d-flex flex-column">
            <span class="font-weight-bold text-white">{{ username }}</span>
            <span class="text-white-50 small">{{ userEmail }}</span>
        </CSidebarFooter>

        <CRenderFunction flat :contentToRender="footer" />
    </CSidebar>
</template>

<script>
export default {
    name: 'TheSidebar',
    data() {
        return {
            username: 'John Doe',
            userEmail: 'user@example.com',
            navs: [{
                _name: 'CSidebarNav',
                _children: [
                    {
                        _name: 'CSidebarNavItem',
                        name: 'Forms',
                        to: '/forms',
                        icon: 'cil-description',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: 'Form Management',
                        to: '/manage',
                        icon: 'cib-ghost',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: 'Analytics',
                        to: '/analytics',
                        icon: 'cil-chart',
                    },
                    {
                        _name: 'CSidebarNavItem',
                        name: 'Permissions',
                        to: '/permissions',
                        icon: 'cil-lock-locked',
                    },
                ]
            }],
            footer: [{
                _name: 'CSidebarNavItem',
                name: 'Logout',
                to: '/login',
                icon: 'cil-account-logout',
            }]
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
        logout() {
            this.$router.push('/pages/login')
        },
    },
    computed: {
        show() {
            return this.$store.state.sidebarShow
        },
        sidebarMinimize() {
            return this.$store.state.sidebarMinimize
        },
    },
}
</script>

<style scoped>
.c-sidebar {
    background: linear-gradient(30deg, #FEC260 0%, #8c1515 60%);
}
</style>
