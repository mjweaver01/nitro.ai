<template>
  <div class="mobile-nav">
    <h2 class="mobile-nav-hero" @click="messagesStore.clearConversation()">
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
export default {
  props: ['forceShow', 'setForceShow'],
  created() {
    this.$watch(
      () => this.$route.path,
      () => {
        this.setForceShow(false)
      },
    )
  },
}
</script>
