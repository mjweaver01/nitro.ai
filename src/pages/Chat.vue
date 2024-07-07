<template>
  <div class="top">
    <Hero />
    <Questions v-if="userStore.user?.id" />
    <Messages v-if="userStore.user?.id" :messages="messagesStore?.messages" />
  </div>
  <Chat v-if="userStore.user?.id" />
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useMessagesStore } from '../stores/messages'
import Hero from '../components/Hero.vue'
import Questions from '../components/Questions.vue'
import Messages from '../components/Messages.vue'
import Chat from '../components/Chat.vue'

export default {
  components: {
    Hero,
    Questions,
    Messages,
    Chat,
  },
  computed: {
    ...mapStores(useUserStore, useMessagesStore),
  },
}
</script>
