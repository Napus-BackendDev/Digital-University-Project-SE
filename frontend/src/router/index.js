import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store/store'

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
            path: '/public/forms/:id',
            name: 'PublicForm',
            component: FormFill,
            props: route => ({ formId: route.params.id })
        },

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

const routePages = {
  Forms: 'Forms',
  FormFill: 'Forms',
  ManageForms: 'Manage Forms',
  EditorCreateForm: 'Manage Forms',
  Response: 'Analytics',
  Analytics: 'Analytics',
  Permissions: 'Permissions',
  Email: 'Email',
  EmailDetail: 'Email'
}

function canRead(user, page) {
  if (!page) return true
  const role = user && user.role
  const titles = Array.isArray(role && role.title) ? role.title : []
  if (titles.some(item => String(item && item.value).toLowerCase() === 'admin')) return true
  const permission = Array.isArray(role && role.permission)
    ? role.permission.find(item => String(item.page) === page)
    : null
  const read = Array.isArray(permission && permission.access)
    ? permission.access.find(item => String(item.key).toLowerCase() === 'read')
    : null
  return !!(read && read.value)
}

router.beforeEach(async (to, from, next) => {
  if (to.name === 'PublicForm') return next()
  if (to.name === 'Login') {
    if (String(process.env.VUE_APP_BYPASS_LOGIN).toLowerCase() !== 'true') return next()
    const bypassUser = await store.dispatch('User/restoreSession')
    return bypassUser ? next(to.query.redirect || '/forms') : next()
  }
  let user = store.getters['User/user']
  if (!user) user = await store.dispatch('User/restoreSession')
  if (!user) return next({ name: 'Login', query: { redirect: to.fullPath } })
  if (!canRead(user, routePages[to.name])) return next({ name: 'Forms', query: { denied: '1' } })
  next()
})

export default router
