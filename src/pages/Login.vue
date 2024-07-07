<template>
  <div class="top login">
    <Hero />
    <div class="login-form">
      <form @submit.prevent="userStore.signInOrCreateUser">
        <input
          id="email-input"
          name="email"
          placeholder="Email"
          v-model="userStore.login.email"
          :disabled="userStore.loggingIn"
        />
        <input
          id="password-input"
          name="password"
          placeholder="Password"
          type="password"
          v-model="userStore.login.password"
          :disabled="userStore.loggingIn"
        />
        <input
          id="secret"
          name="secret"
          placeholder="Secret"
          type="input"
          v-model="userStore.login.secret"
          :disabled="userStore.loggingIn"
          v-if="userStore.login.isNew"
        />
        <button type="submit" disabled v-if="userStore.loggingIn">Logging in</button>
        <button type="submit" v-else-if="userStore.login.isNew">Sign up</button>
        <button type="submit" v-else>Log in</button>
        <p v-if="userStore.loginError.length > 0" class="login-error">{{ userStore.loginError }}</p>
        <div class="checkbox">
          <input type="checkbox" id="new-user" name="new-user" v-model="userStore.login.isNew" />
          <label for="new-user">Create new user</label>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useClientStore } from '../stores/client'
import { useUserStore } from '../stores/user'
import Hero from '../components/Hero.vue'

export default {
  components: {
    Hero,
  },
  computed: {
    ...mapStores(useClientStore, useUserStore),
  },
}
</script>
