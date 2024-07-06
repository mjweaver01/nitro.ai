<template>
  <div class="left-nav" :class="{ 'force-show': !!forceShow }">
    <h2 class="left-nav-hero"><img src="/wsbb.png" width="40" height="40" /> Louie.ai</h2>
    <div class="left-nav-items">
      <div class="conversation" @click="messagesStore.clearConversation()">+ New Conversation</div>
      <h3 class="left-nav-header">Previous Conversations</h3>
      <div class="conversations" v-if="conversationsStore?.conversations?.length > 0">
        <div
          class="conversation"
          :class="{ hover: conversation.id === messagesStore.conversation?.id }"
          v-for="conversation in conversationsStore.conversations"
          @click="messagesStore.setConversation(conversation)"
        >
          {{ conversation.messages[0].content }}
        </div>
      </div>
    </div>
    <div class="left-nav-bottom">
      <div class="logout" v-if="userStore.user?.id">
        <p v-if="userStore.loggingOut">Logging out</p>
        <p @click="userStore.signOutUser" v-else>Logout</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useConversationsStore } from '../stores/conversations'
import { useMessagesStore } from '../stores/messages'
import { useUserStore } from '../stores/user'

export default {
  props: {
    forceShow: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapStores(useConversationsStore, useMessagesStore, useUserStore),
  },
  data() {
    return {
      search: '',
    }
  },

  mounted() {
    this.conversationsStore.getConversations()
  },

  methods: {},
}
</script>

<style scoped></style>
