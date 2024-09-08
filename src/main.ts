import { createApp, markRaw } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { createPinia, setMapStoreSuffix } from 'pinia'

import App from './App.vue'
import { routes } from './routes'

import 'primeicons/primeicons.css'
import './styles/index.css'
import './styles/imessage.css'
import './styles/loading.css'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: routes as RouteRecordRaw[],
})

const pinia = createPinia().use(({ store }) => {
  store.router = markRaw(router)
})
setMapStoreSuffix('')

app.use(pinia)
app.use(router)

app.mount('#app')

declare module 'pinia' {
  export interface MapStoresCustomization {
    // set it to the same value as above
    suffix: ''
  }
}
