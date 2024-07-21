<template>
  <div class="small-sidebar" v-if="sidebarStore?.desktopHide">
    <div class="sidebar-section">
      <div class="new-conversation sidebar-item maximize">
        <i
          class="pi pi-window-maximize"
          style="font-size: 0.9rem; transform: rotate(45deg)"
          @click="sidebarStore.setDesktopHide(!sidebarStore.desktopHide)"
        ></i>
      </div>
      <div class="new-conversation sidebar-item">
        <div class="conversation" @click="messagesStore.clearConversation()">
          <i class="pi pi-check-square" style="font-size: 0.9rem"></i>
        </div>
      </div>
    </div>
    <div class="sidebar-section account-sidebar sidebar-item">
      <div v-if="$route.path.includes('account')">
        <a v-if="userStore.loggingOut"><i class="pi pi-sign-out" style="font-size: 0.9rem"></i></a>
        <a @click="userStore.signOutUser" v-else
          ><i class="pi pi-sign-out" style="font-size: 0.9rem"></i>
        </a>
      </div>
      <RouterLink to="/account" v-else
        ><i class="pi pi-user" style="font-size: 0.9rem"></i>
      </RouterLink>
    </div>
  </div>
  <div
    class="left-nav"
    :class="{
      'force-show': !!sidebarStore?.forceShow,
      'force-hide-desktop': !!sidebarStore?.desktopHide,
    }"
  >
    <MobileNav />
    <div class="new-conversation">
      <div class="conversation" @click="messagesStore.clearConversation()">
        <span>New Conversation</span>
        <i class="pi pi-check-square" style="font-size: 0.9rem"></i>
      </div>
    </div>
    <div class="left-nav-items">
      <h4 class="left-nav-header">Past Conversations</h4>
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
            ><i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i> Logging
            out</a
          >
          <a @click="userStore.signOutUser" v-else
            ><i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
            Logout</a
          >
        </div>
        <RouterLink to="/account" v-else
          ><i class="pi pi-user" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
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
import { useSidebarStore } from '../stores/sidebar'
import MobileNav from './MobileNav.vue'

export default {
  components: {
    MobileNav,
  },
  computed: {
    ...mapStores(useConversationsStore, useMessagesStore, useUserStore, useSidebarStore),
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
