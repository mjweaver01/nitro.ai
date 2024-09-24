<template>
  <div class="mobile-nav">
    <h2 class="mobile-nav-hero" @click.prevent="messagesStore.clearConversation()">
      <img src="/wsbb.png" width="40" height="40" alt="Nitro.ai" /> Nitro.ai
    </h2>
    <i
      class="hamburger pi"
      :class="{ 'pi-bars': !sidebarStore?.forceShow, 'pi-times': sidebarStore?.forceShow }"
      style="font-size: 1.25rem"
      @click="sidebarStore?.setForceShow(!sidebarStore?.forceShow)"
    ></i>
    <div
      class="force-show-hide-button"
      @click="sidebarStore?.setDesktopHide(!sidebarStore?.desktopHide)"
    >
      <i
        class="force-desktop-hide pi pi-window-minimize"
        style="font-size: 0.9rem; transform: rotate(45deg)"
      ></i>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useMessagesStore } from '../stores/messages'
import { useSidebarStore } from '../stores/sidebar'

export default {
  computed: {
    ...mapStores(useMessagesStore, useSidebarStore),
  },
  beforeMount() {
    this.$watch(
      () => this.$route.path,
      () => {
        this.sidebarStore?.setForceShow(false)
      },
    )
  },
}
</script>
