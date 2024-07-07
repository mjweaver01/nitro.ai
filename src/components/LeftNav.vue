<template>
  <div class="left-nav" :class="{ 'force-show': !!forceShow }">
    <h2 class="left-nav-hero" @click="messagesStore.clearConversation()">
      <img src="/wsbb.png" width="40" height="40" /> Louie.ai
    </h2>
    <div class="new-conversation">
      <div class="conversation" @click="messagesStore.clearConversation()">
        <span>New Conversation</span>
        <i class="pi pi-plus" style="font-size: 0.8rem"></i>
      </div>
    </div>
    <div class="left-nav-items">
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
      <div v-else>
        <div class="conversation">No previous conversations</div>
      </div>
    </div>
    <div class="left-nav-bottom">
      <div class="account" v-if="userStore.user?.id">
        <RouterLink to="/account">Account</RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { RouterLink } from 'vue-router'
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
