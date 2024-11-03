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
        <div class="account-conversations-header-container">
          <h3 class="account-conversations-header">
            You've had {{ conversationsStore?.conversations?.length }} conversation{{
              conversationsStore?.conversations?.length !== 1 ? 's' : ''
            }}
            with Nitro!
          </h3>
          <input
            type="search"
            v-model="search"
            placeholder="Search conversations..."
            class="search-input"
          />
        </div>
        <div
          v-for="conversation in filteredPaginatedConversations"
          :key="conversation.id"
          class="account-conversation"
        >
          <div class="account-conversation-item-header">
            <div class="account-conversation-item-header-left">
              <h4>"{{ conversation.messages[0].content }}"</h4>
              <h5>
                {{ conversation.messages.length }} messages with
                <span style="color: var(--blue)">Nitro</span>
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
        <div class="load-more" v-if="search?.length === 0">
          <p v-if="!hasMoreConversations">
            All {{ conversationsStore?.conversations?.length }} conversations loaded.
            <a href="#" @click.prevent="scrollToTop">Back to top?</a>
          </p>
          <button v-else @click="startLoadMore" :disabled="loading">
            {{ loading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
        <div v-else-if="search?.length > 0 && filteredConversations?.length === 0">
          <p>No conversations found.</p>
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

    filteredConversations() {
      if (!this.search) return this.conversationsStore?.conversations

      return this.conversationsStore?.conversations?.filter((conversation) =>
        conversation.messages.some((m) =>
          m.content.toLowerCase().includes(this.search.toLowerCase()),
        ),
      )
    },

    filteredPaginatedConversations() {
      return this.filteredConversations?.slice(0, this.page * this.perPage)
    },

    hasMoreConversations() {
      return this.filteredPaginatedConversations?.length < this.filteredConversations?.length
    },
  },
  data() {
    return {
      page: 1,
      perPage: 10,
      loading: false,
      search: '',
    }
  },
  methods: {
    deleteConversation(conversationId) {
      if (confirm('Are you sure you want to delete this conversation?')) {
        this.conversationsStore.deleteConversation(conversationId)
      }
    },

    async loadMore() {
      console.log('Loading more conversations...')
      this.loading = true
      this.page += 1
    },

    setupIntersectionObserver() {
      const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.hasMoreConversations) {
            this.loadMore()
          }
        })
      }, options)

      // Observe the load more button
      const loadMoreEl = document.querySelector('.load-more')
      if (loadMoreEl) {
        observer.observe(loadMoreEl)
      }

      // Save observer for cleanup
      this.observer = observer
    },

    startLoadMore() {
      this.loadMore()
      this.setupIntersectionObserver()
    },

    scrollToTop() {
      document.querySelector('.account-page').scrollTo({ top: 0, behavior: 'instant' })
    },
  },

  beforeUnmount() {
    // Cleanup observer
    if (this.observer) {
      this.observer.disconnect()
    }
  },
}
</script>

<style scoped>
.account-conversations-header-container {
  margin-bottom: 1rem;
}
</style>
