import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './stores/store'
import moment from 'moment'
import { Icon } from '@iconify/vue'
import i18n from './i18n'
import 'primeicons/primeicons.css'

const app = createApp(App)

// global moment (แทน Vue.prototype)
app.config.globalProperties.$moment = moment

app.component('Icon', Icon)

app.use(router)
app.use(store)
app.use(i18n)

app.mount('#app')
