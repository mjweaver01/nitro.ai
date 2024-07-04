<template>
  <div class="top">
    <div class="logout" v-if="userStore.user?.id">
      <p v-if="userStore.loggingOut">Logging out</p>
      <p @click="userStore.signOutUser" v-else>Logout</p>
    </div>
    <h1 class="hero"><img src="/wsbb.png" width="75" height="75" /> Louie.ai</h1>
    <p>
      An AI chatbot pretrained on Westside Barbell's
      <a href="https://westside-barbell.com/blogs/the-blog/" target="_blank">Blog</a>.
    </p>
    <Questions v-if="userStore.user?.id" />
    <Login v-else />
    <Messages v-if="userStore.user?.id" />
  </div>
  <Chat v-if="userStore.user?.id" />
</template>

<script>
import { mapStores } from 'pinia'
import { useClientStore } from './stores/client'
import { useUserStore } from './stores/user'
import { useMessagesStore } from './stores/messages'

import Chat from './components/Chat.vue'
import Login from './components/Login.vue'
import Questions from './components/Questions.vue'
import Messages from './components/Messages.vue'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore, useMessagesStore),
  },
  components: {
    Chat,
    Login,
    Questions,
    Messages,
  },
  async beforeMount() {
    if (!this.userStore.user.id) {
      const s = await this.clientStore.client.auth.getSession()
      if (s.data?.session?.user) {
        this.userStore.user = s.data.session.user
      } else {
        await this.userStore.authUser()
      }
    }
  },
  mounted() {
    const params = new URLSearchParams(window.location.search)
    const conversationId = params.get('conversationId')
    if (conversationId?.length > 0) this.messagesStore.getConversation(conversationId)

    const selectedModel = params.get('model') || params.get('llm')
    if (selectedModel?.length > 0) this.messagesStore.llm = selectedModel
  },
}
</script>

<style scoped>
/* @todo migrate styles */
</style>
