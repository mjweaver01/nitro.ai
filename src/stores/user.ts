import { defineStore } from 'pinia'
import { useClientStore } from './client'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
      login: {
        email: '',
        password: '',
        isNew: false,
      },
      loggingIn: false,
      loggingOut: false,
      loginError: '',
    }
  },
  getters: {
    // userId: (state) => state.user.id,
    // isLoggedIn: (state) => state.user.id !== undefined,
  },
  actions: {
    async createUser(state) {
      const client = useClientStore()
      const u = await client.client.auth.signUp({
        email: this.login.email,
        password: this.login.password,
      })

      if (u.error && u.error.message) {
        this.loginError = u.error.message
      } else if (u.data?.user?.id) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
      }
    },

    async signInUser(state) {
      const client = useClientStore()
      const u = await client.client.auth.signInWithPassword({
        email: this.login.email,
        password: this.login.password,
      })

      if (u.error && u.error.message) {
        this.loginError = u.error.message
      } else if (u.data?.user?.id) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
      }
    },

    async signInOrCreateUser(state) {
      this.loggingIn = true

      if (this.login.isNew) {
        await this.createUser()
      } else {
        await this.signInUser()
      }

      this.loggingIn = false
    },

    async signOutUser(state) {
      this.loggingOut = true

      try {
        const client = useClientStore()
        await client.client.auth.signOut()
      } catch {}

      this.user = null
      localStorage.removeItem('user')

      this.loggingOut = false
    },
  },
})
