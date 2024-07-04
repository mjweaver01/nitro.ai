<template>
  <div>
    <div id="imessage" class="imessage" v-if="messagesStore.messages.length > 0">
      <p
        v-for="message in messagesStore.messages"
        v-bind:class="{
          'from-me': message.isUser || message.role === 'user',
          'from-them': !message.isUser && message.role !== 'user',
        }"
        v-html="sanitizeMessage(message.text?.output ?? message.text ?? message.content)"
      ></p>
      <p v-if="messagesStore.loading" class="from-them loading-message">
        <span class="loading">
          <span class="dot one"></span>
          <span class="dot two"></span>
          <span class="dot three"></span>
        </span>
        <span class="tail"></span>
      </p>
      <div id="bottom"></div>
    </div>
  </div>
  <div class="current-message">
    <div
      class="clear"
      v-if="messagesStore.messages.length > 0"
      @click="messagesStore.clearConversation"
    >
      Clear conversation
    </div>
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
            <select v-model="messagesStore.llm" @change="setLlm">
              <option value="openai">GPT-4o</option>
              <option value="anthropic">Claude Sonnet</option>
            </select>
          </div>
        </div>
        <button type="submit">Ask</button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useMessagesStore } from '../stores/messages'
import { useClientStore } from '../stores/client'
import showdown from 'showdown'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore, useMessagesStore),
  },
  data() {
    return {
      converter: new showdown.Converter(),
    }
  },

  methods: {
    sanitizeMessage(message) {
      return this.converter.makeHtml(message)
    },
  },
}
</script>

<style scoped></style>
