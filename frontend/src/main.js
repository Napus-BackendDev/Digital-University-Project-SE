import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './stores/store'
import moment from 'moment'
import 'primeicons/primeicons.css'

const app = createApp(App)

// global moment (แทน Vue.prototype)
app.config.globalProperties.$moment = moment

app.use(router)
app.use(store)

app.mount('#app')
