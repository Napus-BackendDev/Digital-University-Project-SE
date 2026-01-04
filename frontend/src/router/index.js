/**
 * Vue Router Configuration
 * กำหนดเส้นทาง URL ของแอป
 */
import { createRouter, createWebHistory } from 'vue-router'
import UserDashboard from '../views/UserDashboard.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // หน้า Login - หน้าแรก
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    
    // หน้า Home - User Dashboard
    {
      path: '/home',
      name: 'home',
      component: UserDashboard,
    },

    // หน้า Editor Dashboard
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/EditorDashboard.vue'),
    },

    // หน้าสร้างฟอร์มใหม่
    {
      path: '/form-builder',
      name: 'form-builder',
      component: () => import('../views/FormBuilderView.vue'),
    },

    // หน้าแก้ไขฟอร์ม (รับ ID จาก URL)
    {
      path: '/form-builder/:id',
      name: 'form-builder-edit',
      component: () => import('../views/FormBuilderView.vue')
    },
    
    // หน้า Public Form สำหรับกรอกแบบฟอร์ม (URL ที่แชร์ให้ผู้ใช้)
    {
      path: '/form/:id',
      name: 'public-form',
      component: () => import('../views/Response.vue'),
    },
    
    // หน้าแสดงฟอร์มสำหรับตอบ (Response) - internal
    {
      path: '/form/:id/response',
      name: 'form-response',
      component: () => import('../views/FormfillView.vue'),
    }
  ]
})

export default router
