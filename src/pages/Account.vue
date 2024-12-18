<template>
  <div class="top account-page">
    <div v-if="userStore?.user?.id" class="account-page-content">
      <div class="account-top">
        <div class="account-top-top">
          <div>
            <h2 class="account-header">Account</h2>
            <div class="info-status">
              <h4 class="account-header">{{ userStore?.user?.email }}</h4>
              <div class="pill" :class="{ admin: userStore?.user?.isAdmin }">
                {{ userStore?.user?.isAdmin ? 'Administrator' : userStore?.user?.role }}
              </div>
            </div>
          </div>
          <div>
            <div class="logout">
              <p v-if="userStore.loggingOut">
                <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
                Logging out
              </p>
              <p @click="userStore.signOutUser" v-else>
                <i class="pi pi-sign-out" style="font-size: 0.9rem; margin-right: 0.5rem"></i>
                Logout
              </p>
            </div>
          </div>
        </div>
        <p class="account-last-login">
          Last login:
          {{
            new Date(
              userStore?.user?.last_sign_in_at ?? userStore?.user?.updated_at,
            ).toLocaleDateString('en-US')
          }}
          at
          {{
            new Date(
              userStore?.user?.last_sign_in_at ?? userStore?.user?.updated_at,
            ).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            })
          }}
        </p>
      </div>
      <TabContent :tabs="tabs" />
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import TabContent from '@/components/TabContent.vue'

export default {
  components: {
    TabContent,
  },
  computed: {
    ...mapStores(useUserStore),
    tabs() {
      const t = [
        {
          id: 'conversations',
          title: 'Conversations',
          path: '/account/conversations',
        },
        {
          id: 'profile',
          title: 'Training Profile',
          path: '/account/profile',
        },
      ]

      if (this.userStore?.user?.isAdmin) {
        t.push({
          id: 'admin',
          title: 'Admin',
          path: '/account/admin',
        })
      }

      return t
    },
  },
}
</script>
