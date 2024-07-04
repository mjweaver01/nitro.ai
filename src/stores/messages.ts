import { nextTick } from 'vue'
import { defineStore } from 'pinia'

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [],
    question: '',
    conversationId: '',
    loading: false,
    llm: 'openai',
  }),
  actions: {
    async ask(sentQuestion = '') {
      const question =
        sentQuestion?.trim() !== ''
          ? sentQuestion?.trim()
          : this.question.trim() !== ''
          ? this.question.trim()
          : false
      if (!question || question.length <= 0) return

      this.loading = true
      this.scrollToBottom()
      this.question = ''

      this.messages.push({
        text: question,
        isUser: true,
      })

      await fetch(`/.netlify/functions/ask${window.location.search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          conversationId: this.conversationId,
          model: this.llm,
          user: this.isDefaultQuestion ? 'anonymous' : this.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          try {
            const parsedData = JSON.parse(JSON.stringify(data))

            if (parsedData.answer) {
              if (parsedData.answer.conversationId) {
                this.conversationId = parsedData.answer.conversationId
                const url = new URL(window.location.href)
                url.searchParams.set('conversationId', parsedData.answer.conversationId)
                window.history.pushState(null, '', url.toString())
              }

              this.messages.push({
                ...parsedData,
                text: parsedData.answer,
                isCached: parsedData.isCached || false,
                time: parsedData.time || false,
              })
            }

            this.question = ''
          } catch {
          } finally {
            this.loading = false
            this.scrollToBottom()
          }
        })
        .catch((err) => {
          console.error(err)
          this.loading = false

          this.messages.push({
            text: "I'm sorry, I'm having trouble understanding you. Please try again.",
          })
        })
    },

    async getConversation(sentConversation) {
      fetch(`/.netlify/functions/get-conversation${window.location.search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: sentConversation,
          user: this.isDefaultQuestion ? 'anonymous' : this.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.conversation && data.conversation.messages) {
            this.messages = data.conversation.messages
            this.conversationId = data.conversation.id
          } else {
            this.clearConversation()
          }
        })
    },

    scrollToBottom() {
      nextTick(() => {
        if (window.innerWidth < 500) {
          document.getElementById('question-input')?.focus()
          const app = document.getElementById('app')
          if (app) {
            app.scrollTop = app.scrollHeight
          }
        }
      })
    },

    clearConversation() {
      this.messages = []
      this.question = ''
      this.conversationId = ''
      this.scrollToBottom()

      const url = new URL(window.location.href)
      url.searchParams.delete('conversationId')
      window.history.pushState(null, '', url.toString())
    },

    sanitizeMessage(message) {
      return this.converter.makeHtml(message)
    },

    setLlm() {
      const url = new URL(window.location.href)
      url.searchParams.set('model', this.llm)
      window.history.pushState(null, '', url.toString())
      this.clearConversation()
    },
  },
})
