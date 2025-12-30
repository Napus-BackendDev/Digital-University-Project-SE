/**
 * Main Entry Point
 * จุดเริ่มต้นของแอป Vue
 */

// Import global styles
import './assets/main.css'

// Vue และ plugins
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// App และ Router
import App from './App.vue'
import router from './router'

// สร้าง Vue app
const app = createApp(App)

// เพิ่ม Pinia (state management)
app.use(createPinia())

// เพิ่ม Router
app.use(router)

// Mount app ไปที่ #app ใน index.html
app.mount('#app')
