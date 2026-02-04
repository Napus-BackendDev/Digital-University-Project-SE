import { createRouter, createWebHistory } from 'vue-router'

import TheContainer from '../containers/TheContainer.vue'

import LoginView from '../views/LoginView.vue'
import UserDashboard from '../views/UserDashboard.vue'
import EditorDashboard from '../views/EditorDashboard.vue'
import Response from '../views/Response.vue'
import PreviewView from '../views/PreviewView.vue'
import FormBuilderView from '../views/FormBuilderView/FormBuilderView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/',
      redirect: '/login',
      name: 'home',
      component: TheContainer,
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: UserDashboard
        },
        {
          path: 'editor',
          name: 'Editor',
          component: EditorDashboard
        },
        {
          path: 'admin',
          name: 'Admin',
          component: AdminDashboard
        },
        {
          path: 'form-builder/:id',
          name: 'Form-builder',
          component: FormBuilderView
        },
        {
          path: 'preview/:id',
          name: 'Preview',
          component: PreviewView
        },
        {
          path: 'response/:id',
          name: 'Response',
          component: Response
        }
      ]
    }
  ]
})

export default router
