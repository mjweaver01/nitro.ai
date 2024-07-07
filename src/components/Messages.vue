<template>
  <div id="imessage" class="imessage" v-if="messages.length > 0">
    <p
      v-for="message in messages"
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
</template>

<script>
import { mapStores } from 'pinia'
import { useMessagesStore } from '../stores/messages'
import showdown from 'showdown'

export default {
  props: ['messages'],
  computed: {
    ...mapStores(useMessagesStore),
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
