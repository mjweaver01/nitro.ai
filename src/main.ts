import { createApp } from 'vue'
import { createPinia, setMapStoreSuffix } from 'pinia'
import App from './App.vue'

import './styles/index.css'
import './styles/imessage.css'
import './styles/loading.css'

const pinia = createPinia()
setMapStoreSuffix('')

const app = createApp(App)
app.use(pinia)

app.mount('#app')

declare module 'pinia' {
  export interface MapStoresCustomization {
    // set it to the same value as above
    suffix: ''
  }
}
