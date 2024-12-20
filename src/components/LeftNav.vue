<template>
  <div class="small-sidebar" v-if="sidebarStore?.desktopHide">
    <div class="sidebar-section">
      <div
        class="new-conversation sidebar-item maximize"
        @click="sidebarStore?.setDesktopHide(!sidebarStore?.desktopHide)"
      >
        <i class="pi pi-window-maximize" style="font-size: 0.9rem; transform: rotate(45deg)"></i>
      </div>
      <div class="new-conversation sidebar-item" @click="messagesStore?.clearConversation()">
        <div class="conversation">
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
      'force-show-flex': !!sidebarStore?.forceShow,
      'force-hide-desktop': !!sidebarStore?.desktopHide,
    }"
  >
    <MobileNav />
    <div class="new-conversation" @click="messagesStore?.clearConversation()">
      <div class="conversation">
        <span>New Conversation</span>
        <i class="pi pi-check-square" style="font-size: 0.9rem"></i>
      </div>
    </div>
    <div class="nav-item search-container">
      <input
        type="search"
        v-model="search"
        placeholder="Search conversations..."
        class="search-input"
      />
    </div>
    <div class="left-nav-items">
      <div class="conversations" v-if="filteredConversations.length > 0">
        <div
          class="conversation"
          :class="{ hover: conversation.id === messagesStore?.conversation?.id }"
          v-for="conversation in filteredConversations"
          @click="messagesStore?.setConversation(conversation, true)"
        >
          {{ conversation.messages[0].content[0].text ?? conversation.messages[0].content }}
        </div>
      </div>
      <div v-else>
        <div class="conversation">No conversations found.</div>
      </div>
    </div>
    <div class="left-nav-bottom">
      <div class="account" v-if="userStore?.user?.id">
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
    filteredConversations() {
      if (!this.search) return this.conversationsStore?.conversations || []

      return (
        this.conversationsStore?.conversations?.filter((conversation) => {
          const content =
            conversation.messages[0].content[0].text ?? conversation.messages[0].content
          return content.toLowerCase().includes(this.search.toLowerCase())
        }) || []
      )
    },
  },
  data() {
    return {
      search: '',
    }
  },
  beforeMount() {
    this.conversationsStore?.getConversations()
  },
}
</script>
