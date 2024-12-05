import Chat from './pages/Chat.vue'
import Login from './pages/Login.vue'
import Account from './pages/Account.vue'
import Admin from './pages/Admin.vue'

export const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat },
  { path: '/chat/:id', component: Chat },
  { path: '/account', component: Account },
  { path: '/mw', component: Admin },
]
