import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store/store'
import api, { setUnauthorizedHandler } from '@/service/api'
import {
    isProtectedRoute,
    clearClientSession,
    buildLoginLocation,
    verifyActiveSession
} from '@/projects/utils/authSession'
import { canManageForms } from '@/projects/utils/formPolicy'

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
const AnalyticsFormDetail = () => import('@/projects/views/AnalyticsFormDetail.vue')
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
                    props: route => ({ formId: route.params.id }),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'response/:id',
                    name: 'Response',
                    component: Response,
                    props: true,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'analytics',
                    redirect: { name: 'ManageForms' },
                    meta: { requiresAuth: true }
                },
                {
                    path: 'analytics/:formId',
                    name: 'AnalyticsFormReport',
                    component: AnalyticsFormDetail,
                    props: true,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'permissions',
                    redirect: { name: 'ManageForms' },
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
                    props: true,
                    meta: { requiresAuth: true }
                }
            ]
        },

        {
            path: '/login',
            redirect: '/pages/login'
        },
        {
            path: '/pages',
            redirect: '/pages/login',
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
        },
        {
            path: '*',
            redirect: '/forms'
        }
    ]
})

export function isManageRestrictedRoute(route) {
    if (!route) return false;
    const name = route.name;
    // Explicitly do NOT block EditorCreateForm (/manage/:_id), Response (/response/:id), or AnalyticsFormReport (/analytics/:formId)
    if (name === 'EditorCreateForm' || name === 'Response' || name === 'AnalyticsFormReport') {
        return false;
    }
    if (['ManageForms', 'Analytics', 'Email', 'EmailDetail'].includes(name)) {
        return true;
    }
    const path = String(route.path || '').replace(/\/+$/, '');
    if (path === '/manage' || path === '/analytics' || path.startsWith('/email')) {
        return true;
    }
    return false;
}

router.beforeEach(async (to, from, next) => {
    if (!isProtectedRoute(to)) {
        return next()
    }

    const user = await verifyActiveSession({ store, api })
    if (!user) {
        return next(buildLoginLocation(to.fullPath))
    }

    if (isManageRestrictedRoute(to) && !canManageForms(user)) {
        return next({ path: '/forms', query: { denied: 'manage' } })
    }

    return next()
})

setUnauthorizedHandler(() => {
    const currentRoute = router.currentRoute
    if (!isProtectedRoute(currentRoute)) {
        return
    }
    clearClientSession(store)
    router.replace(buildLoginLocation(currentRoute && currentRoute.fullPath)).catch(() => {})
})

export default router
