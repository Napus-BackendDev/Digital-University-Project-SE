import Vue from 'vue'
import Router from 'vue-router'

// Containers
const TheContainer = () => import('@/containers/TheContainer')

// Login
const Login = () => import('@/projects/views/Login.vue')

// Page (actual files)
const Forms = () => import('@/projects/views/Forms.vue')
const FormFill = () => import('@/projects/views/page/FormFill.vue')

// Editor
const ManageForms = () => import('@/projects/views/ManageForms.vue')
const CreateForm = () => import('@/projects/views/page/CreateForm.vue')

// Page details
const Response = () => import('@/projects/views/Responsedetail.vue')

// Admin
const Analytics = () => import('@/projects/views/Analytics.vue')
const Permission = () => import('@/projects/views/security/Permission.vue')
const Email = () => import('@/projects/views/email/index.vue')
const EmailDetail = () => import('@/projects/views/email/detail.vue')

Vue.use(Router)

export default new Router({
    mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: [

        {
            path: '/',
            redirect: 'forms',
            name: 'Home',
            component: TheContainer,
            children: [
                {
                    path: 'forms',
                    name: 'Forms',
                    component: Forms
                },
                {
                    path: 'forms/:id',
                    name: 'FormFill',
                    component: FormFill,
                    props: route => ({ formId: route.params.id })
                },
                {
                    path: 'manage',
                    name: 'ManageForms',
                    component: ManageForms
                },
                {
                    path: 'manage/:_id',
                    name: 'EditorCreateForm',
                    component: CreateForm
                },
                {
                    path: 'preview/:id',
                    name: 'Preview',
                    component: FormFill,
                    props: route => ({ formId: route.params.id })
                },
                {
                    path: 'response/:id',
                    name: 'Response',
                    component: Response,
                    props: true
                },
                {
                    path: 'analytics',
                    name: 'Analytics',
                    component: Analytics
                },
                {
                    path: 'permissions',
                    name: 'Permissions',
                    component: Permission
                },
                {
                    path: 'email',
                    name: 'Email',
                    component: Email
                },
                {
                    path: 'email/:id',
                    name: 'EmailDetail',
                    component: EmailDetail,
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
