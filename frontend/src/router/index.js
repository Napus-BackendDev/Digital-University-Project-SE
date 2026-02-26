import Vue from 'vue'
import Router from 'vue-router'

// Containers
const TheContainer = () => import('@/containers/TheContainer')

// Login
const Login = () => import('@/projects/views/Login.vue')

// User
const UserDashboard = () => import('@/projects/views/user/Dashboard.vue')
const UserFormFill = () => import('@/projects/views/user/FormFill.vue')

// Editor
const EditorDashboard = () => import('@/projects/views/editor/Dashboard.vue')
const EditorCreateForm = () => import('@/projects/views/editor/CreateForm.vue')

// Admin
const AdminDashboard = () => import('@/projects/views/admin/Dashboard.vue') 


Vue.use(Router)

export default new Router({
    mode: 'history',
    scrollBehavior: () => ({y: 0}),
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
                    props: true
                },

                {
                    path: 'editor/dashboard',
                    name: 'EditorDashboard',
                    component: EditorDashboard
                },

                {
                    path: 'admin/dashboard',
                    name: 'AdminDashboard',
                    component: AdminDashboard
                },

                {
                    path: 'editor/dashboard/:_id',
                    name: 'EditorCreateForm',
                    component: EditorCreateForm
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
