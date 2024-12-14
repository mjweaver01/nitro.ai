<template>
  <div class="tab-container">
    <div class="tab-headers">
      <router-link
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.path"
        custom
        v-slot="{ isActive, navigate }"
      >
        <div class="tab-header" :class="{ active: isActive }" @click="navigate">
          {{ tab.title }}
        </div>
      </router-link>
    </div>
    <div class="tab-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true,
      validator: (tabs) => tabs.every((tab) => tab.title && tab.path),
    },
  },
}
</script>

<style scoped>
.tab-container {
  width: 100%;
  overflow: hidden;
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: var(--white);
}

.tab-header {
  padding: 18px;
  cursor: pointer;
  border-right: 1px solid var(--border-color);
  text-transform: uppercase;
  font-weight: bold;
}

.tab-header:last-child {
  border-right: none;
}

.tab-header:hover {
  background: var(--light-blue);
}

.tab-header.active {
  background: var(--blue);
  color: var(--white);
}

.tab-content {
  padding: 1em;
  background: var(--white);
}
</style>
