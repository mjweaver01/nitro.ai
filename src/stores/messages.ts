import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useConversationsStore } from './conversations'
import { useRouter } from 'vue-router' // Add this import

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [],
    question: '',
    conversationId: '',
    loading: false,
    llm: 'openai',
    router: useRouter(), // Add this line
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

      const response = await fetch(`/.netlify/functions/ask${window.location.search}`, {
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

      if (!response.ok) {
        this.loading = false
        this.messages.push({
          text: "I'm sorry, I'm having trouble understanding you. Please try again.",
        })
        return
      }

      // Check if the response is JSON (cached) or stream
      const contentType = response.headers.get('Content-Type')
      if (contentType && contentType.includes('application/json')) {
        // Handle cached response
        const cachedData = await response.json()
        this.loading = false
        this.messages.push({
          text: cachedData.answer,
          isUser: false,
        })
        if (cachedData.conversationId) {
          this.conversationId = cachedData.conversationId
          this.router.push(`/chat/${cachedData.conversationId}`)
        }
        this.scrollToBottom()
        conversations.getConversations()
        return
      }

      // Handle streaming response (existing code)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiMessage = { text: '', isUser: false }
      this.messages.push(aiMessage)
      let receivedConversationId = null

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        if (chunk.length > 0) {
          this.loading = false
          if (chunk.startsWith('{') && chunk.endsWith('}')) {
            try {
              const jsonData = JSON.parse(chunk)
              if (jsonData.conversationId) {
                receivedConversationId = jsonData.conversationId
              }
            } catch (e) {
              console.error('Error parsing JSON:', e)
            }
          } else {
            this.messages[this.messages.length - 1].text += chunk
          }
          this.scrollToBottom()
        }
      }

      // when it's done
      this.loading = false
      this.scrollToBottom()

      if (receivedConversationId) {
        this.conversationId = receivedConversationId
        this.router.push(`/chat/${receivedConversationId}`)
      }

      conversations.getConversations()
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
