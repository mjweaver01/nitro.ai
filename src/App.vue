<template>
  <div class="app-wrapper">
    <div class="app-content">
      <LeftNav v-if="userStore?.user?.id" />
      <div class="app" :class="{ 'force-hide': sidebarStore?.forceShow }">
        <Banner />
        <TopNav v-if="userStore?.user?.id" />
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useClientStore } from './stores/client'
import { useUserStore } from './stores/user'
import { useMessagesStore } from './stores/messages'
import { useSidebarStore } from './stores/sidebar'
import LeftNav from './components/LeftNav.vue'
import TopNav from './components/TopNav.vue'
import Banner from './components/Banner.vue'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore, useMessagesStore, useSidebarStore),
  },
  components: {
    LeftNav,
    TopNav,
    Banner,
  },
  async created() {
    if (!this.userStore?.user?.id) {
      const s = await this.clientStore?.client?.auth.getSession()
      if (s?.data?.session?.user) {
        this.userStore.user = s.data.session.user
      } else if (this.userStore) {
        await this.userStore?.authUser()
      }

      if (this.userStore && !this.userStore.user.id) {
        this.$router.push('/login')
      }
    }
  },
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app {
  display: flex;
  flex-flow: column;
  height: 100%;
  width: 100%;
  overflow: scroll;

  &.force-hide {
    display: none;

    @media (min-width: $tablet) {
      display: flex;
    }
  }
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: absolute;
  width: 100%;
  top: 0;
  bottom: 0;

  .app-content {
    display: flex;
    flex: 1;
    min-height: 0; /* Crucial for nested flex containers */
    position: relative;
  }
}

@media (min-width: $tablet) {
  .top-nav {
    display: none;
  }
}
</style>
