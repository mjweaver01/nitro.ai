<template>
  <div class="current-message">
    <div class="current-message-inner">
      <div
        class="clear"
        v-if="messagesStore?.messages?.length > 0"
        @click="messagesStore?.clearConversation"
      >
        Clear conversation
      </div>
      <div class="ask-question" v-if="userStore?.user?.id">
        <form @submit.prevent="messagesStore?.ask()">
          <div class="input-wrapper">
            <div class="input-wrapper-inner">
              <textarea
                rows="1"
              id="question-input"
              name="question"
              placeholder="Ask anything..."
              v-model="messagesStore.question"
              @keydown.enter.exact.prevent="messagesStore?.ask()"
                @keydown.up.exact.prevent="messagesStore?.setPrevousQuestion()"
              />
              <FileUpload />
            </div>
            <div class="select">
              <select v-model="messagesStore.model" @change="messagesStore?.clearConversation()">
                <option v-for="model in models" :value="model.id">
                  {{ model.value }}
                </option>
              </select>
            </div>
          </div>
          <button v-if="messagesStore?.streaming" @click="messagesStore?.cancelStream()">
            <i class="pi pi-stop-circle"></i>
          </button>
          <button type="submit" :disabled="messagesStore?.loading" v-else>
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
import { modelOptions } from '../../server/constants'
import FileUpload from './FileUpload.vue'

export default {
  computed: {
    ...mapStores(useUserStore, useMessagesStore),
  },
  data() {
    return {
      models: modelOptions,
    }
  },
  components: {
    FileUpload,
  },
}
</script>

<style scoped>
.ask-question form {
  width: 100%;
  display: grid;
  grid-template-columns: auto 75px;
  gap: 0.5em;
}

.clear {
  color: rgb(106, 106, 106);
  font-size: 0.9em;
  margin-bottom: 2px;
  cursor: pointer;
}

@media (min-width: 768px) {
  .clear {
    position: absolute;
    top: -1.5rem;
  }
}

.current-message {
  position: relative;
  padding: 0.5em;
  border-top: 1px solid var(--border-color);
}

.current-message-inner {
  max-width: 800px;
  margin: 0 auto;
}
</style>
