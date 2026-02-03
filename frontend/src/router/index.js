import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import UserDashboard from '../views/UserDashboard.vue'
import EditorDashboard from '../views/EditorDashboard.vue'
import Response from '../views/Response.vue'
import PreviewView from '../views/PreviewView.vue'
import FormBuilderView from '../views/FormBuilderView/FormBuilderView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView
  },
  {
    path: '/home',
    name: 'home',
    component: UserDashboard
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorDashboard
  },
  {
    path: '/form-builder/:id',
    name: 'form-builder',
    component: FormBuilderView
  },
  {
    path: '/preview/:id',
    name: 'preview',
    component: PreviewView
  },
  {
    path: '/response/:id',
    name: 'response',
    component: Response
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
