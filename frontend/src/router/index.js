import Vue from 'vue'
import Router from 'vue-router'
import api from '@/service/api'

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

const router = new Router({
    mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: [
        {
            path: '/',
            redirect: 'forms',
            name: 'Home',
            component: TheContainer,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'forms',
                    name: 'Forms',
                    component: Forms,
                    meta: { requiresAuth: true }
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
                    component: ManageForms,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'manage/:_id',
                    name: 'EditorCreateForm',
                    component: CreateForm,
                    meta: { requiresAuth: true }
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
                    meta: { requiresAuth: true },
                    props: true
                },
                {
                    path: 'analytics',
                    name: 'Analytics',
                    component: Analytics,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'permissions',
                    name: 'Permissions',
                    component: Permission,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'email',
                    name: 'Email',
                    component: Email,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'email/:id',
                    name: 'EmailDetail',
                    component: EmailDetail,
                    meta: { requiresAuth: true },
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

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (!requiresAuth) {
        return next()
    }

    try {
        const res = await api.auth('me')
        if (res && res.data && res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user))
            return next()
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('activeUserId')
            return next({ name: 'Login' })
        }
    } catch (error) {
        localStorage.removeItem('user')
        localStorage.removeItem('activeUserId')
        return next({ name: 'Login' })
    }
})

export default router
