<template>
  <div class="top account-page">
    <div v-if="userStore?.user?.id">
      <h2>Account</h2>
      <h3 class="account-header">{{ userStore?.user?.email }}</h3>
      <h4 class="account-header">{{ userStore?.user?.id }}</h4>
      <div class="logout">
        <p v-if="userStore.loggingOut">
          <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i> Logging out
        </p>
        <p @click="userStore.signOutUser" v-else>
          <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i> Logout
        </p>
      </div>
      <h3 class="account-conversations-header">All Conversations</h3>
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
