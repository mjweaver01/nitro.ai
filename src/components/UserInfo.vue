<template>
  <div class="user-info-form">
    <h3 class="account-header">Your Training Profile</h3>
    <form @submit.prevent="saveUserInfo">
      <div class="form-group">
        <label for="physique-knowledge">Physique & Training Knowledge</label>
        <textarea
          id="physique-knowledge"
          v-model="form.physique_and_knowledge"
          placeholder="Describe your current physique and lifting experience..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="equipment">Available Equipment</label>
        <textarea
          id="equipment"
          v-model="form.workout_equipment"
          placeholder="List the equipment you have access to..."
          rows="4"
        ></textarea>
      </div>

      <button type="submit" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Profile' }}
      </button>
    </form>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '../stores/user'

export default {
  name: 'UserInfoForm',
  data() {
    return {
      saving: false,
      form: {
        physique_and_knowledge: '',
        workout_equipment: '',
      },
    }
  },
  computed: {
    ...mapStores(useUserStore),
  },
  async created() {
    // Load existing user info
    const info = await this.userStore.getUserInfo()
    if (info) {
      this.form.physique_and_knowledge = info.physique_and_knowledge || ''
      this.form.workout_equipment = info.workout_equipment || ''
    }
  },
  methods: {
    async saveUserInfo() {
      this.saving = true
      try {
        await this.userStore.updateUserInfo(this.form)
      } catch (error) {
        console.error('Error saving user info:', error)
      }
      this.saving = false
    },
  },
}
</script>

<style scoped>
.user-info-form {
  max-width: var(--mobile);
  margin: 0 auto;
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
}
</style>
