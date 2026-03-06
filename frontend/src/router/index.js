import Vue from 'vue'
import Router from 'vue-router'

// Containers
const TheContainer = () => import('@/containers/TheContainer')

// Login
const Login = () => import('@/projects/views/Login.vue')

// User
const UserDashboard = () => import('@/projects/views/user/Dashboard.vue')
const UserFormFill = () => import('@/projects/views/page/Fillform.vue')

// Editor
const EditorDashboard = () => import('@/projects/views/editor/Dashboard.vue')
const EditorCreateForm = () => import('@/projects/views/editor/CreateForm.vue')

// Page
const Fillform = () => import('@/projects/views/page/Fillform.vue')
const Responedetail = () => import('@/projects/views/page/Responedetail.vue')

// Admin
const AdminUsermanager = () => import('@/projects/views/admin/Usermanager.vue')
const AdminStatistic = () => import('@/projects/views/admin/Statistic.vue')


Vue.use(Router)

export default new Router({
    mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: [

        {
            path: '/',
            redirect: '/editor/dashboard',
            name: 'Home',
            component: TheContainer,
            children: [

                {
                    path: 'user/dashboard',
                    name: 'UserDashboard',
                    component: UserDashboard
                },

                {
                    path: 'user/form-fill/:id',
                    name: 'UserFormFill',
                    component: UserFormFill,
                    props: route => ({ formId: route.params.id })
                },

                {
                    path: 'editor/dashboard',
                    name: 'EditorDashboard',
                    component: EditorDashboard
                },

                {
                    path: 'admin/usermanager',
                    name: 'AdminUsermanager',
                    component: AdminUsermanager
                },

                {
                    path: 'admin/statistic',
                    name: 'AdminStatistic',
                    component: AdminStatistic
                },

                {
                    path: 'editor/dashboard/:_id',
                    name: 'EditorCreateForm',
                    component: EditorCreateForm
                },

                {
                    path: 'editor/preview/:id',
                    name: 'EditorPreview',
                    component: Fillform,
                    props: route => ({ formId: route.params.id })
                },

                {
                    path: 'user/response/:id',
                    name: 'ResponseDetail',
                    component: Responedetail,
                    props: true
                }

            ]
        },

        {
            path: '/pages',
            redirect: '/pages/404',
            name: 'Pages',
            component: {
                render(c) {
                    return c('router-view')
                }
            },
            children: [
                {
                    path: 'login',
                    name: 'Login',
                    component: Login
                }
            ]
        }
    ]
})
