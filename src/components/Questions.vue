<template>
  <div v-if="user?.id">
    <div class="questions" v-if="messages.length <= 0">
      <div class="question" v-for="question in defaultQuestions" @click="ask(question, true)">
        {{ question }}
      </div>
    </div>
    <div id="imessage" class="imessage" v-if="messages.length > 0">
      <p
        v-for="message in messages"
        v-bind:class="{
          'from-me': message.isUser || message.role === 'user',
          'from-them': !message.isUser && message.role !== 'user',
        }"
        v-html="sanitizeMessage(message.text?.output ?? message.text ?? message.content)"
      ></p>
      <p v-if="loading" class="from-them loading-message">
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
</template>

<script>
import { createClient } from '@supabase/supabase-js'
import showdown from 'showdown'

export default {
  data() {
    return {
      client: {},
      login: {
        email: '',
        password: '',
        isNew: false,
      },
      loggingIn: false,
      loggingOut: false,
      loginError: '',
      user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
      messages: [],
      loading: false,
      conversationId: '',
      question: '',
      llm: 'openai',
      defaultQuestions: [
        'Tell me a little bit about yourself',
        'Give me a high level overview of Westside Barbell',
        'Who is Louie? Tell me about him, his legacy, and what Westside means to him',
        'Who is Tom Barry to Louie?',
        'What is circa max?',
        'Tell me how to peak for competition, using the Conjugate Method',
        'Tell me the benefits of box squatting correctly',
        'How do I bench press correctly, according to Louie?',
        'What is the Conjugate Method?',
        'What is the best way to get started with the Conjugate Method?',
        'What was the reverse hyper invented for? How is it best used?',
        'Give me the best powerlifting routine for a newcomer to the sport',
        'What advice would Louie give to a powerlifer struggling to improve their numbers?',
        'Give me a workout Louie would have loved',
        'Should I wear knee sleeves or wraps when squatting?',
        "Compare Arnold Schwarzenegger's lifting style to Louie's",
      ],
      converter: new showdown.Converter(),
    }
  },
  async mounted() {
    this.client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PRIVATE_KEY,
    )

    const s = await this.client.auth.getSession()
    if (s.data?.session?.user) {
      this.user = s.data.session.user
    } else {
      await this.authUser()
    }

    const params = new URLSearchParams(window.location.search)
    const conversationId = params.get('conversationId')
    if (conversationId?.length > 0) this.getConversation(conversationId)

    const selectedModel = params.get('model') || params.get('llm')
    if (selectedModel?.length > 0) this.llm = selectedModel
  },
  methods: {
    // conversation
    async ask(sentQuestion = '', isDefaultQuestion = false) {
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

      await fetch(`/ask-kb${window.location.search}`, {
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
      fetch(`/get-conversation${window.location.search}`, {
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
      this.$nextTick(() => {
        if (window.innerWidth < 500) {
          document.getElementById('question-input').focus()
          this.$el.scrollTop = this.$el.scrollHeight
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

    // user management
    async createUser() {
      const u = await this.client.auth.signUp({
        email: this.login.email,
        password: this.login.password,
      })

      if (u.error && u.error.message) {
        this.loginError = u.error.message
      } else if (u.data?.user?.id) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
      }
    },

    async signInUser() {
      const u = await this.client.auth.signInWithPassword({
        email: this.login.email,
        password: this.login.password,
      })

      if (u.error && u.error.message) {
        this.loginError = u.error.message
      } else if (u.data?.user?.id) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        this.loginError = ''
      }
    },

    async signInOrCreateUser() {
      this.loggingIn = true

      if (this.login.isNew) {
        await this.createUser()
      } else {
        await this.signInUser()
      }

      this.loggingIn = false
    },

    async signOutUser() {
      this.loggingOut = true

      try {
        await this.client.auth.signOut()
      } catch {}

      this.user = null
      localStorage.removeItem('user')

      this.loggingOut = false
    },

    async authUser() {
      const u = await this.client.auth.getUser()
      if (u?.data?.user) {
        this.user = u.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    },
  },
}
</script>

<style scoped></style>
