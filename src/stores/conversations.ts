import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useClientStore } from './client'
import { useMessagesStore } from './messages'

export const useConversationsStore = defineStore('conversations', {
  state: () => {
    return {
      conversations: localStorage.getItem('conversations')
        ? JSON.parse(localStorage.getItem('conversations'))
        : [],
    }
  },
  actions: {
    getConversations() {
      const client = useClientStore()
      const user = useUserStore()

      if (!client.client || !user.user) return

      client.client
        .from('conversations')
        .select('*')
        .eq('user', user.user.id)
        .order('created_at', { ascending: false })
        .then((res) => {
          this.conversations = res.data
          localStorage.setItem('conversations', JSON.stringify(res.data))
        })
    },

    setConversation(sentConversation) {
      const messages = useMessagesStore()
      messages.setConversation(sentConversation, true)
    },
  },
})
