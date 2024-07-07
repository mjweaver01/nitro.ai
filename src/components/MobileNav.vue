<template>
  <div class="mobile-nav">
    <h2 class="mobile-nav-hero" @click.prevent="messagesStore.clearConversation()">
      <img src="/wsbb.png" width="40" height="40" alt="Louie.ai" /> Louie.ai
    </h2>
    <i
      class="pi"
      :class="{ 'pi-bars': !forceShow, 'pi-times': forceShow }"
      @click="setForceShow(!forceShow)"
    ></i>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useMessagesStore } from '../stores/messages'

export default {
  props: ['forceShow', 'setForceShow'],
  computed: {
    ...mapStores(useMessagesStore),
  },
  beforeMount() {
    this.$watch(
      () => this.$route.path,
      () => {
        this.setForceShow(false)
      },
    )
  },
}
</script>
