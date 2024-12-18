<template>
  <div class="admin">
    <h1>Admin</h1>

    <div v-if="seedingStatus">
      <p>Status: {{ seedingStatus }}</p>
    </div>

    <div class="admin-actions">
      <div class="admin-actions-buttons">
        <button @click="seedVectorStore" :disabled="isSeeding">
          {{ isSeeding ? 'Seeding...' : 'Seed Vector Store' }}
        </button>

        <button @click="clearVectorStore" :disabled="isSeeding">Clear Vector Store</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'

export default {
  data() {
    return {
      seedingStatus: '',
      isSeedingComplete: false,
      isSeeding: false,
    }
  },

  computed: {
    ...mapStores(useUserStore),
  },

  methods: {
    async seedVectorStore() {
      if (!this.userStore.isAdmin) return

      try {
        this.isSeeding = true
        this.seedingStatus = 'Starting vector store seeding...'

        const response = await fetch('/.netlify/functions/seed', {
          method: 'POST',
          body: JSON.stringify({
            user: this.userStore.user,
            action: 'seed',
          }),
        })

        if (!response.ok) throw new Error('Failed to seed vector store')

        const eventSource = new EventSource('/.netlify/functions/seed')

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          this.seedingStatus = data.message

          if (data.complete) {
            eventSource.close()
            this.isSeeding = false
            this.isSeedingComplete = true
          }
        }

        eventSource.onerror = () => {
          eventSource.close()
          this.isSeeding = false
          this.seedingStatus = 'Error occurred while seeding'
        }
      } catch (error) {
        console.error('Error seeding vector store:', error)
        this.seedingStatus = 'Error occurred while seeding'
        this.isSeeding = false
      }
    },

    async clearVectorStore() {
      if (!this.userStore.isAdmin) return

      try {
        const response = await fetch('/.netlify/functions/seed', {
          method: 'POST',
          body: JSON.stringify({
            user: this.userStore.user,
            action: 'clear',
          }),
        })

        if (!response.ok) throw new Error('Failed to clear vector store')

        this.seedingStatus = 'Vector store cleared'
        this.isSeedingComplete = false
      } catch (error) {
        console.error('Error clearing vector store:', error)
        this.seedingStatus = 'Error occurred while clearing'
      }
    },
  },

  async created() {
    // Redirect if not admin
    if (!this.userStore.isAdmin) {
      this.$router.push('/chat')
    }
  },
}
</script>

<style scoped>
.admin {
  padding: 0 1em 1em;
}
</style>
