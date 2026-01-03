/**
 * Vue Router Configuration
 * กำหนดเส้นทาง URL ของแอป
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // หน้า Login
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    
    // หน้าแรก - แสดงรายการฟอร์มทั้งหมด
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    
    // หน้า About
    {
      path: '/about',
      name: 'about',
      // lazy load - โหลดเมื่อเข้าหน้านี้
      component: () => import('../views/AboutView.vue'),
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
      component: () => import('../views/FormBuilderView.vue'),
    },
  ],
})

export default router
