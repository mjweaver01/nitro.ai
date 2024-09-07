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
    nocache: false,
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

      // set nocache on each question for ability to turn it on and off
      if (window.location.search.includes('nocache=true')) {
        this.nocache = true
      } else if (window.location.search.includes('nocache=false')) {
        this.nocache = false
      }

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
          nocache: this.nocache,
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
        // dont scroll to bottom if no stream
        // this.scrollToBottom()
        conversations.getConversations()
        return
      }

      // Handle streaming response
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
          if (chunk.includes('{') && chunk.includes('}')) {
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
            this.setConversation(data.conversation, true)
          } else {
            this.clearConversation()
          }
        })
    },

    scrollToBottom() {
      nextTick(() => {
        document.getElementById('question-input')?.focus()
        const chat = document.querySelector('.chat-page')
        if (chat) {
          chat.scrollTop = chat.scrollHeight
        }
      })
    },

    scrollToTop() {
      nextTick(() => {
        const chat = document.querySelector('.chat-page')
        if (chat) {
          chat.scrollTop = 0
        }
      })
    },

    clearConversation() {
      this.messages = []
      this.question = ''
      this.conversationId = ''
      this.router.push(`/`)
    },

    setConversation(sentConversation, scrollToTop = false) {
      this.messages = sentConversation.messages
      this.conversationId = sentConversation.id
      this.router.push(`/chat/${this.conversationId}`)
      if (scrollToTop) {
        this.scrollToTop()
      } else {
        this.scrollToBottom()
      }
    },

    sanitizeMessage(message) {
      return this.converter.makeHtml(message)
    },

    setLlm() {
      this.clearConversation()
    },
  },
})
