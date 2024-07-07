<template>
  <div class="top">
    <div v-if="userStore?.user?.id">
      <h1>Account</h1>
      <h2>{{ userStore?.user?.email }}</h2>
      <h3>{{ userStore?.user?.id }}</h3>
      <div class="logout">
        <p v-if="userStore.loggingOut">Logging out</p>
        <p @click="userStore.signOutUser" v-else>Logout</p>
      </div>
      <div class="account-conversations" v-if="conversationsStore?.conversations?.length > 0">
        <div v-for="conversation in conversationsStore?.conversations" class="account-conversation">
          <div class="account-conversation-item-header">
            <h4>{{ conversation.messages.length }} messages</h4>
            <h4>{{ conversation.id }}</h4>
          </div>
          <div class="account-conversation-item">
            <Messages :messages="conversation.messages" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useConversationsStore } from '../stores/conversations'
import Messages from '../components/Messages.vue'

export default {
  components: {
    Messages,
  },
  computed: {
    ...mapStores(useUserStore, useConversationsStore),
  },
}
</script>
