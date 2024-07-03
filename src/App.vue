<template>
  <div class="top">
    <div class="logout" v-if="userStore.user?.id">
      <p v-if="loggingOut">Logging out</p>
      <p @click="signOutUser" v-else>Logout</p>
    </div>
    <h1 class="hero"><img src="/wsbb.png" width="75" height="75" /> Louie.ai</h1>
    <p>
      An AI chatbot pretrained on Westside Barbell's
      <a href="https://westside-barbell.com/blogs/the-blog/" target="_blank">Blog</a>.
    </p>
    <Questions v-if="userStore.user?.id" />
    <Login v-else />
  </div>
  <Chat v-if="userStore.user?.id" />
</template>

<script>
import { mapStores } from 'pinia'
import { useClientStore } from './stores/client'
import { useUserStore } from './stores/user'

import Chat from './components/Chat.vue'
import Login from './components/Login.vue'
import Questions from './components/Questions.vue'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore),
  },
  components: {
    Chat,
    Login,
    Questions,
  },
}
</script>

<style scoped>
/* @todo migrate styles */
</style>
