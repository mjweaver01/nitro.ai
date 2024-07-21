<template>
  <div class="top-hero" v-if="messagesStore?.conversationId?.length <= 0 || !userStore.user?.id">
    <h1 class="hero"><img src="/wsbb.png" width="75" height="75" alt="Nitro.ai" /></h1>
    <h2>Weak. Things. Break.</h2>
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
