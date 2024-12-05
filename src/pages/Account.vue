<template>
  <div class="top account-page">
    <div v-if="userStore?.user?.id" class="account-page-content">
      <div class="account-top">
        <div className="account-top-top">
          <div>
            <h2 class="account-header">Account</h2>
            <div class="info-status">
              <h4 class="account-header">{{ userStore?.user?.email }}</h4>
              <div class="pill">{{ userStore?.user?.role }}</div>
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
import { useUserStore } from '../stores/user'
import AccountQuestions from '../components/AccountQuestions.vue'
import TabContent from '../components/TabContent.vue'
import UserInfo from '../components/UserInfo.vue'

export default {
  components: {
    AccountQuestions,
    TabContent,
  },
  computed: {
    ...mapStores(useUserStore),
  },
  data() {
    return {
      tabs: [
        { id: 'conversations', title: 'Conversations', component: AccountQuestions },
        { id: 'user-info', title: 'Training Profile', component: UserInfo },
      ],
    }
  },
}
</script>
