<template>
  <div class="left-nav" :class="{ 'force-show': !!forceShow }">
    <MobileNav :forceShow="forceShow" :setForceShow="setForceShow" />
    <div class="new-conversation">
      <div class="conversation" @click="messagesStore.clearConversation()">
        <span>New Conversation</span>
        <i class="pi pi-check-square" style="font-size: 0.8rem"></i>
      </div>
    </div>
    <div class="left-nav-items">
      <h3 class="left-nav-header">Past Conversations</h3>
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
        <div v-if="$route.path.includes('account')">
          <a v-if="userStore.loggingOut"
            ><i class="pi pi-sign-out" style="font-size: 0.8rem; margin-right: 0.5rem"></i> Logging
            out</a
          >
          <a @click="userStore.signOutUser" v-else
            ><i class="pi pi-sign-out" style="font-size: 0.8rem; margin-right: 0.5rem"></i>
            Logout</a
          >
        </div>
        <RouterLink to="/account" v-else
          ><i class="pi pi-user" style="font-size: 0.8rem; margin-right: 0.5rem"></i>
          Account</RouterLink
        >
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
import MobileNav from './MobileNav.vue'

export default {
  props: {
    forceShow: {
      type: Boolean,
      default: false,
    },
    setForceShow: {
      type: Function,
      default: () => {},
    },
  },
  components: {
    MobileNav,
  },
  computed: {
    ...mapStores(useConversationsStore, useMessagesStore, useUserStore),
  },
  data() {
    return {
      search: '',
    }
  },
  beforeMount() {
    this.conversationsStore.getConversations()
  },
}
</script>

<style scoped></style>
