<template>
  <div id="imessage" class="imessage" v-if="messages?.length > 0">
    <p
      v-for="message in messages"
      v-bind:class="{
        'from-me': message.isUser || message.role === 'user',
        'from-them': !message.isUser && message.role !== 'user',
      }"
    >
      <VueShowdown
        :markdown="message.text?.output ?? message.text ?? message.content"
        :extensions="[showdownMathjax]"
        :options="{ emoji: true, tables: true, math: true }"
      />
    </p>
    <p v-if="messagesStore?.loading" class="from-them loading-message">
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
import { VueShowdown } from 'vue-showdown'
import showdownMathjax from 'showdown-mathjax'

export default {
  props: ['messages'],
  computed: {
    ...mapStores(useMessagesStore),
  },
  methods: {
    showdownMathjax,
  },
  mounted() {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub])
      })
    },
  },
}
</script>

<style scoped></style>
