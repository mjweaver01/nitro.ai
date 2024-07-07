import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useConversationsStore } from './conversations'

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
      const user = useUserStore()
      const conversations = useConversationsStore()

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
          user: this.isDefaultQuestion ? 'anonymous' : user?.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          try {
            const parsedData = JSON.parse(JSON.stringify(data))

            if (parsedData.answer) {
              if (parsedData.answer.conversationId) {
                this.conversationId = parsedData.answer.conversationId
                this.router.push(`/chat/${this.conversationId}`)
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
            conversations.getConversations()
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
      const user = useUserStore()
      fetch(`/.netlify/functions/get-conversation${window.location.search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: sentConversation,
          user: this.isDefaultQuestion ? 'anonymous' : user?.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.conversation && data.conversation.messages) {
            this.setConversation(data.conversation)
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
      this.router.push(`/chat`)
    },

    setConversation(sentConversation) {
      this.messages = sentConversation.messages
      this.conversationId = sentConversation.id
      this.router.push(`/chat/${this.conversationId}`)
      this.scrollToBottom()
    },

    sanitizeMessage(message) {
      return this.converter.makeHtml(message)
    },

    setLlm() {
      this.clearConversation()
    },
  },
})
