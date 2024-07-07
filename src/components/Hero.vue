<template>
  <div class="top-hero" v-if="messagesStore?.conversationId?.length <= 0 || !userStore.user?.id">
    <h1 class="hero"><img src="/wsbb.png" width="75" height="75" /> Louie.ai</h1>
    <p>
      An AI chatbot pretrained on Westside Barbell's
      <a href="https://westside-barbell.com/blogs/the-blog/" target="_blank">Blog</a>.
    </p>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useMessagesStore } from '../stores/messages'

export default {
  computed: {
    ...mapStores(useUserStore, useMessagesStore),
  },
}
</script>
