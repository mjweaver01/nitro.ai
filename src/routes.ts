import Chat from './pages/Chat.vue'
import Login from './pages/Login.vue'
import Account from './pages/Account.vue'
import Admin from './pages/Admin.vue'
import AccountQuestions from './components/AccountQuestions.vue'
import UserInfo from './components/UserInfo.vue'

export const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat },
  { path: '/chat/:id', component: Chat },
  {
    path: '/account',
    component: Account,
    children: [
      { path: '', redirect: '/account/conversations' },
      { path: 'conversations', component: AccountQuestions },
      { path: 'profile', component: UserInfo },
      { path: 'admin', component: Admin },
    ],
  },
]
