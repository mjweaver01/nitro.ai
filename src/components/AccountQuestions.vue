<template>
  <div class="account-conversations" v-if="conversationsStore?.conversations?.length > 0">
    <div class="account-conversations-header-container">
      <h3 class="account-header">
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
            <span style="color: var(--blue)">{{ convertModel(conversation.model) }}</span>
          </h5>
        </div>
        <i
          class="pi pi-trash delete-icon"
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
  <div class="account-conversations" v-else>
    <div class="account-conversations-header-container">
      <h3 class="account-header">No conversations found.</h3>
      <p>
        You haven't had any conversations with Nitro yet.
        <router-link to="/">Start a conversation</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useConversationsStore } from '../stores/conversations'
import Messages from './Messages.vue'

export default {
  name: 'AccountQuestions',
  components: {
    Messages,
  },
  computed: {
    ...mapStores(useConversationsStore),

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

      const loadMoreEl = document.querySelector('.load-more')
      if (loadMoreEl) {
        observer.observe(loadMoreEl)
      }

      this.observer = observer
    },

    startLoadMore() {
      this.loadMore()
      this.setupIntersectionObserver()
    },

    scrollToTop() {
      document.querySelector('.account-page').scrollTo({ top: 0, behavior: 'instant' })
    },

    convertModel(model) {
      const modelName = model.includes('mini') ? 'Mini' : model.includes('gpt-4o') ? 'Full' : model
      return `Nitro (${modelName})`
    },
  },

  beforeUnmount() {
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
