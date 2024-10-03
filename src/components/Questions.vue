<template>
  <div v-if="userStore?.user?.id">
    <div class="questions" v-if="messagesStore?.messages?.length <= 0">
      <div
        class="question"
        v-for="question in defaultQuestions"
        @click="messagesStore?.ask(question)"
      >
        {{ question }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'
import { useMessagesStore } from '../stores/messages'

export default {
  computed: {
    ...mapStores(useUserStore, useMessagesStore),
  },
  data() {
    return {
      defaultQuestions: [
        'Tell me a little bit about yourself',
        'Give me a high level overview of Westside Barbell',
        'Who is Louie? Tell me about him, his legacy, and what Westside means to him',
        'Who is Tom Barry to Louie?',
        'What is circa max?',
        'Recommend a few of the best smelling salts for a seasoned powerlifter',
        'Recommend some books that will help me learn more about powerlifting',
        "Create a full men's outfit using WSBB products",
        'Tell me how to peak for competition, using the Conjugate Method',
        'Tell me the benefits of box squatting correctly',
        'How do I bench press correctly, according to Louie?',
        'What is the Conjugate Method? How can I get started with it?',
        'What was the reverse hyper invented for? How is it best used?',
        'Give me the best powerlifting routine for a newcomer to the sport',
        'What advice would Louie give to a powerlifer struggling to improve their numbers?',
        'Give me a workout Louie would have loved',
        'Should I wear knee sleeves or wraps when squatting?',
        "Compare Arnold Schwarzenegger's lifting style to Louie's",
      ],
    }
  },
}
</script>

<style scoped></style>
