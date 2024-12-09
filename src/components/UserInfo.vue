<template>
  <div class="user-info-form">
    <h3 class="account-header">Your Training Profile</h3>
    <form @submit.prevent="saveUserInfo">
      <div class="form-group">
        <label for="physique-knowledge">Age & Physique</label>
        <textarea
          id="physique-knowledge"
          v-model="form.physique"
          placeholder="Describe your current physique..."
          rows="4"
          :disabled="userStore.userInfoLoading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="experience">Training Knowledge & Experience</label>
        <textarea
          id="experience"
          v-model="form.experience"
          placeholder="Describe your training knowledge and experience..."
          rows="4"
          :disabled="userStore.userInfoLoading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="goals">Fitness Goals</label>
        <textarea
          id="goals"
          v-model="form.goals"
          placeholder="Describe your fitness goals..."
          rows="4"
          :disabled="userStore.userInfoLoading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="equipment">Available Equipment</label>
        <textarea
          id="equipment"
          v-model="form.equipment"
          placeholder="List the equipment you have access to..."
          rows="4"
          :disabled="userStore.userInfoLoading"
        ></textarea>
      </div>

      <button type="submit" :disabled="saving || userStore.userInfoLoading">
        {{ buttonText }}
      </button>
    </form>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  name: 'UserInfoForm',
  data() {
    return {
      saving: false,
      saved: false,
      form: {
        physique: '',
        experience: '',
        goals: '',
        equipment: '',
      },
    }
  },
  computed: {
    ...mapStores(useUserStore),

    buttonText() {
      if (this.saving) return 'Saving...'
      if (this.saved) return 'Changes Saved'
      return 'Save Profile'
    },
  },
  async created() {
    // Load existing user info
    const info = await this.userStore.getUserInfo()
    if (info) {
      this.form.physique = info.physique || ''
      this.form.experience = info.experience || ''
      this.form.goals = info.goals || ''
      this.form.equipment = info.equipment || ''
    }
  },
  methods: {
    async saveUserInfo() {
      this.saving = true
      try {
        await this.userStore.updateUserInfo(this.form)
        this.saved = true
        alert('Profile updated')
        setTimeout(() => {
          this.saved = false
        }, 2000)
      } catch (error) {
        console.error('Error saving user info:', error)
      }
      this.saving = false
    },
  },
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.user-info-form {
  max-width: $mobile;
  margin: 0 auto;
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;

  label {
    display: block;
    margin-bottom: 0.25rem;
  }
}
</style>
