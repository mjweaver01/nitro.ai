<template>
  <div class="banner" v-html="bannerStore?.message" v-if="bannerStore?.enable" />
</template>

<script>
import { mapStores } from 'pinia'
import { useBannerStore } from '@/stores/banner'

export default {
  computed: {
    ...mapStores(useBannerStore),
  },
}
</script>

<style scoped>
.banner {
  text-align: center;
  background-color: black;
  padding: 0.25em;
}
</style>
