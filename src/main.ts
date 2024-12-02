import { createApp, markRaw } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { createPinia, setMapStoreSuffix } from 'pinia'
import { VueShowdownPlugin } from 'vue-showdown'
import { VueReCaptcha } from 'vue-recaptcha-v3'

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
app.use(VueShowdownPlugin)
if (import.meta.env.PROD) {
  app.use(VueReCaptcha, {
    siteKey: '6LfHIXIqAAAAAKMmti5gxJUdc4FbCouVzRSjlt95',
    loaderOptions: {
      autoHideBadge: true,
    },
  })
}

app.mount('#app')

declare module 'pinia' {
  export interface MapStoresCustomization {
    // set it to the same value as above
    suffix: ''
  }
}
