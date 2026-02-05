import Vue from 'vue'
import Router from 'vue-router'

// Containers
const TheContainer = () => import('@/containers/TheContainer')

// Login
const Login = () => import('@/projects/views/Login.vue')

// User
const UserDashboard = () => import('@/projects/views/user/Dashboard.vue')

// Editor
const EditorDashboard = () => import('@/projects/views/editor/Dashboard.vue')

// Admin
const AdminDashboard = () => import('@/projects/views/admin/Dashboard.vue') 


Vue.use(Router)

export default new Router({
    mode: 'history',
    scrollBehavior: () => ({y: 0}),
    routes: [

        {
            path: '/',
            redirect: '/dashboard',
            name: 'Home',
            component: TheContainer,
            children: [

                {
                    path: 'user/dashboard',
                    name: 'UserDashboard',
                    component: UserDashboard
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
