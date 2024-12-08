<template>
  <div id="imessage" class="imessage" v-if="messages?.length > 0">
    <p
      v-for="(message, i) in messages"
      v-bind:class="{
        'from-me': message.isUser || message.role === 'user',
        'from-them': !message.isUser && message.role !== 'user',
        streaming: messagesStore?.streaming && i === messages.length - 1,
      }"
    >
      <template v-if="Array.isArray(message.content)">
        <template v-for="(content, j) in message.content" :key="j">
          <VueShowdown
            v-if="content.type === 'text' && !content.text?.includes('File content from')"
            :markdown="content.text"
            :extensions="[showdownMathjax]"
            :options="{ emoji: true, tables: true, math: true }"
          />
          <div 
            v-else-if="content.type === 'text' && content.text?.includes('File content from')"
            class="file-attachment"
          >
            <i class="pi pi-file"></i>
            <span class="file-name">
              {{ content.text.split('File content from ')[1].split(':')[0] }}
            </span>
          </div>
          <img
            v-else-if="content.type === 'image_url'"
            :src="content.image_url.url"
            :alt="'Uploaded content'"
          />
        </template>
      </template>
      <VueShowdown
        v-else
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
    this.messagesStore?.mathjax()
  },
}
</script>

<style scoped>
.file-attachment {
  display: flex;
  align-items: center;
  gap: 0.25em;
  padding: 0.25rem !important;
  background: var(--light-blue);
  color: var(--blue);
  border-radius: 3px;
}

.file-attachment > * {
  margin: 0 !important;
  white-space: nowrap;
  width: auto !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-attachment i {
  font-size: 1.2em;
  color: var(--blue);
}

.file-name {
  color: var(--text-color);
  font-weight: 500;
}

.file-indicator {
  color: var(--text-muted);
  font-size: 0.9em;
  font-style: italic;
}

.file-content {
  background: var(--light-blue);
  border-radius: 5px;
  padding: 1em;
  margin: 0.5em 0;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.5em;
  padding-bottom: 0.5em;
  border-bottom: 1px solid var(--border-color);
}

.file-header i {
  font-size: 1.2em;
  color: var(--blue);
}

.file-header span {
  color: var(--text-color);
  font-size: 0.9em;
}

.file-content :deep(pre) {
  background: var(--white);
  padding: 1em;
  border-radius: 3px;
  overflow-x: auto;
}

.file-content :deep(code) {
  font-family: monospace;
}
</style>
