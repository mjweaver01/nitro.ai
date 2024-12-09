<template>
  <div class="top-nav">
    <h2 class="top-nav-hero" @click.prevent="messagesStore?.clearConversation()">
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

<style lang="scss" scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  background: var(--white);
  top: 0;
  width: 100%;
  padding-right: 1em;
  border-bottom: 1px solid var(--border-color);
  z-index: 2;

  .force-show-hide-button {
    display: none;
    padding: 0.5em;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background: var(--light-blue);
    }
  }

  .hamburger {
    @media (min-width: 768px) {
      display: none;
    }
  }

  @media (min-width: 768px) {
    padding-right: 0.5em;

    .force-show-hide-button {
      display: block;
    }
  }

  .top-nav-hero {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0.5rem;
    cursor: pointer;
  }
}

.mobile-nav-right-area {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
