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
          <h4>"{{ getMessageContent(conversation.messages[0]) }}"</h4>
          <h5>
            {{ conversation.messages.length }} messages with
            <span style="color: var(--blue)">{{ convertModel(conversation.model) }}</span>
          </h5>
        </div>
        <i
          class="pi pi-trash delete-icon"
          @click.stop="conversationsStore?.deleteConversation(conversation.id)"
          style="color: var(--red)"
        ></i>
      </div>
      <div class="account-conversation-item">
        <Messages :messages="conversation.messages" />
      </div>
    </div>
    <div
      class="load-more"
      v-if="search?.length === 0 && conversationsStore?.conversations?.length > 10"
    >
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
  <div v-else>
    <p>No conversations found.</p>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useConversationsStore } from '@/stores/conversations'
import Messages from '@/components/Messages.vue'

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
          this.getMessageContent(m).toLowerCase().includes(this.search.toLowerCase()),
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
      const modelName = model.includes('gemini') ? 'Gemini' : model.includes('mini') ? '4o Mini' : model.includes('gpt-4o') ? '4o' : model
      return `Nitro (${modelName})`
    },

    getMessageContent(message) {
      if (!message) return ''
      if (typeof message.content === 'string') return message.content
      if (Array.isArray(message.content) && message.content.length > 0) {
        return message.content[0].text || ''
      }
      return ''
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

.load-more {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
</style>
