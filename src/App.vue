<template>
  <div class="app-wrapper">
    <div class="app-content">
      <LeftNav v-if="userStore?.user?.id" />
      <div class="app" :class="{ 'force-hide': sidebarStore?.forceShow }">
        <Banner />
        <MobileNav v-if="userStore?.user?.id" />
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
import MobileNav from './components/MobileNav.vue'
import Banner from './components/Banner.vue'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore, useMessagesStore, useSidebarStore),
  },
  components: {
    LeftNav,
    MobileNav,
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
