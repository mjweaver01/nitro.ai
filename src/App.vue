<template>
  <div class="app-wrapper">
    <LeftNav
      v-if="userStore.user?.id"
      :forceShow="forceShow"
      :setForceShow="setForceShow"
      :desktopHide="desktopHide"
      :setDesktopHide="setDesktopHide"
    />
    <div class="app" :class="{ 'force-hide': forceShow }">
      <MobileNav
        v-if="userStore?.user?.id"
        :forceShow="forceShow"
        :setForceShow="setForceShow"
        :desktopHide="desktopHide"
        :setDesktopHide="setDesktopHide"
      />
      <RouterView />
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { RouterView } from 'vue-router'
import { useClientStore } from './stores/client'
import { useUserStore } from './stores/user'
import { useMessagesStore } from './stores/messages'
import LeftNav from './components/LeftNav.vue'
import MobileNav from './components/MobileNav.vue'

export default {
  computed: {
    ...mapStores(useClientStore, useUserStore, useMessagesStore),
  },
  data() {
    return {
      forceShow: false,
      desktopHide: false,
    }
  },
  components: {
    LeftNav,
    MobileNav,
  },
  async created() {
    if (!this.userStore?.user?.id) {
      const s = await this.clientStore?.client?.auth.getSession()
      if (s.data?.session?.user) {
        this.userStore.user = s.data.session.user
      } else {
        await this.userStore.authUser()
      }

      if (!this.userStore.user.id) {
        this.$router.push('/login')
      }
    }
  },
  methods: {
    setForceShow(show) {
      show ? (this.forceShow = true) : (this.forceShow = false)
    },

    setDesktopHide(show) {
      show ? (this.desktopHide = true) : (this.desktopHide = false)
    },
  },
}
</script>

<style scoped>
/* @todo migrate styles */
</style>
