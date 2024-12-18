import { defineStore } from 'pinia'
import { useClientStore } from './client'
import { useReCaptcha } from 'vue-recaptcha-v3'

export const useUserStore = defineStore('user', {
  state: () => {
    const reCaptcha = import.meta.env.PROD ? useReCaptcha() : null

    return {
      user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
      reCaptcha,
      token: null,
      login: {
        email: '',
        password: '',
        isNew: false,
        secret: '',
      },
      loggingIn: false,
      loggingOut: false,
      loginError: '',
      userInfo: {
        physique: '',
        equipment: '',
      },
      userInfoLoading: false,
    }
  },
  getters: {
    // userId: (state) => state.user.id,
    // isLoggedIn: (state) => state.user.id !== undefined,
  },
  actions: {
    async createUser(state) {
      if (this.login.secret.trim() === '') {
        this.loginError = 'Please enter a secret'
        return
      }

      const hasCorrectSecret = await this.authSecret()
      if (!hasCorrectSecret) {
        this.loginError = 'Incorrect secret'
        return
      }

      const client = useClientStore()
      const u = await client.client.auth.signUp({
        email: this.login.email,
        password: this.login.password,
      })

      if (u.error && u.error.message) {
        this.loginError = u.error.message
      } else if (u.data?.user?.id) {
        this.user = u.data.user
        const isAdminUser = await this.isAdmin()
        this.user.isAdmin = isAdminUser
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
        this.router.push('/')
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
        const isAdminUser = await this.isAdmin()
        this.user.isAdmin = isAdminUser
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
        this.router.push('/')
      }
    },

    async signInOrCreateUser(state) {
      this.loggingIn = true
      this.loginError = ''

      if (import.meta.env.PROD) {
        const recaptchaResponse = await this.verifyRecaptcha()
        if (!recaptchaResponse) {
          return
        }
      }

      if (this.login.isNew) {
        await this.createUser()
      } else {
        await this.signInUser()
      }

      this.loggingIn = false
    },

    async signOutUser(state) {
      if (confirm('Are you sure you want to log out?')) {
        this.loggingOut = true

        try {
          const client = useClientStore()
          await client.client.auth.signOut()
        } catch {}

        this.user = null
        localStorage.removeItem('user')
        localStorage.removeItem('conversations')

        this.router.push('/login')

        this.loggingOut = false
      }
    },

    async authUser() {
      const client = useClientStore()
      const u = await client?.client?.auth?.getUser()
      if (u?.data?.user) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    },

    async authSecret() {
      const s = await fetch('/.netlify/functions/secret', {
        method: 'POST',
        body: JSON.stringify({ secret: this.login.secret }),
      }).then((res) => res.json())

      return s?.code === 200
    },

    async isAdmin() {
      const a = await fetch('/.netlify/functions/is-admin', {
        method: 'POST',
        body: JSON.stringify({ user: this.user }),
      }).then((res) => res.json())

      return a?.code === 200
    },

    async verifyRecaptcha() {
      const token = (await this.reCaptcha?.executeRecaptcha('login')) ?? null
      this.token = token

      if (!this.token) {
        this.loginError = 'Please verify you are human'
        return false
      }

      return true
    },

    async getUserInfo() {
      this.userInfoLoading = true

      if (
        this.userInfo &&
        Object.values(this.userInfo).some((value) => value?.toString().trim().length > 0)
      ) {
        this.userInfoLoading = false
        return this.userInfo
      }

      return await this.refreshUserInfo()
    },

    async refreshUserInfo() {
      const client = useClientStore()
      const { data, error } = await client.client
        .from('user_info')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (data) {
        this.userInfo = data
      }
      this.userInfoLoading = false
      return data
    },

    async updateUserInfo(info: {
      physique: string
      experience: string
      goals?: string
      equipment?: string
    }) {
      this.userInfoLoading = true
      const client = useClientStore()
      const { data, error } = await client.client
        .from('user_info')
        .upsert({
          id: this.user.id,
          ...info,
        })
        .select()
        .single()

      if (data) {
        this.userInfo = data
      }
      this.userInfoLoading = false
      return data
    },
  },
})
