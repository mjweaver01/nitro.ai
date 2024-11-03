<template>
  <div class="top account-page">
    <div v-if="userStore?.user?.id" class="account-page-content">
      <div class="account-top">
        <div className="account-top-top">
          <div>
            <h2 class="account-header">Account</h2>
            <div class="info-status">
              <h4 class="account-header">{{ userStore?.user?.email }}</h4>
              <div class="pill">{{ userStore?.user?.role }}</div>
            </div>
          </div>
          <div>
            <!-- <h4 class="account-header">{{ userStore?.user?.id }}</h4> -->
            <div class="logout">
              <p v-if="userStore.loggingOut">
                <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
                Logging out
              </p>
              <p @click="userStore.signOutUser" v-else>
                <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
                Logout
              </p>
            </div>
          </div>
        </div>
        <p class="account-last-login">
          Last login:
          {{
            new Date(
              userStore?.user?.last_sign_in_at ?? userStore?.user?.updated_at,
            ).toLocaleDateString('en-US')
          }}
          at
          {{
            new Date(
              userStore?.user?.last_sign_in_at ?? userStore?.user?.updated_at,
            ).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            })
          }}
        </p>
      </div>
      <div class="account-conversations" v-if="conversationsStore?.conversations?.length > 0">
        <h3 class="account-conversations-header">
          You've had {{ conversationsStore?.conversations?.length }} conversation{{
            conversationsStore?.conversations?.length !== 1 ? 's' : ''
          }}
          with Nitro!
        </h3>
        <div
          v-for="conversation in paginatedConversations"
          :key="conversation.id"
          class="account-conversation"
          v-lazy="{ threshold: 0.5 }"
        >
          <div class="account-conversation-item-header">
            <div class="account-conversation-item-header-left">
              <h4>"{{ conversation.messages[0].content }}"</h4>
              <h5>
                {{ conversation.messages.length }} messages with
                <span style="color: var(--blue)">{{ convertModel(conversation.model) }}</span>
              </h5>
            </div>
            <i
              class="pi pi-trash"
              @click.stop="deleteConversation(conversation.id)"
              style="color: var(--red)"
            ></i>
          </div>
          <div class="account-conversation-item">
            <Messages :messages="conversation.messages" />
          </div>
        </div>
        <div v-if="hasMoreConversations" class="load-more">
          <button @click="loadMore" :disabled="loading">
            {{ loading ? 'Loading...' : 'Load More' }}
          </button>
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

    paginatedConversations() {
      return this.conversationsStore?.conversations?.slice(0, this.page * this.perPage)
    },

    hasMoreConversations() {
      return this.paginatedConversations?.length < this.conversationsStore?.conversations?.length
    },
  },
  data() {
    return {
      page: 1,
      perPage: 10,
      loading: false,
    }
  },
  methods: {
    convertModel(model) {
      if (model?.includes('gpt')) {
        return 'ChatGPT'
      } else if (model?.includes('anthropic')) {
        return 'Claude Sonnet 3.5'
      }

      return 'ChatGPT'
    },

    deleteConversation(conversationId) {
      if (confirm('Are you sure you want to delete this conversation?')) {
        this.conversationsStore.deleteConversation(conversationId)
      }
    },

    async loadMore() {
      this.loading = true
      try {
        this.page += 1
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
