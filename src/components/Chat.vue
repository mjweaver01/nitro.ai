<template>
  <div class="current-message">
    <div
      class="clear"
      v-if="messagesStore.messages.length > 0"
      @click="messagesStore.clearConversation"
    >
      Clear conversation
    </div>
    <div class="current-message-inner">
      <div class="ask-question" v-if="userStore.user?.id">
        <form @submit.prevent="messagesStore.ask()">
          <div class="input-wrapper">
            <input
              id="question-input"
              name="question"
              placeholder="Ask anything..."
              v-model="messagesStore.question"
            />
            <div class="select">
              <select v-model="messagesStore.llm" @change="messagesStore.setLlm">
                <option value="openai">GPT-4o</option>
                <option value="anthropic">Claude Sonnet</option>
              </select>
            </div>
          </div>
          <button type="submit">
            <i class="pi pi-send"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useMessagesStore } from '../stores/messages'

export default {
  computed: {
    ...mapStores(useUserStore, useMessagesStore),
  },
  created() {
    const conversationId = this.$route.params.id
    if (conversationId?.length > 0) this.messagesStore.getConversation(conversationId)

    const params = new URLSearchParams(window.location.search)
    const selectedModel = params.get('model') || params.get('llm')
    if (selectedModel?.length > 0) this.messagesStore.llm = selectedModel
  },
}
</script>

<style scoped></style>
