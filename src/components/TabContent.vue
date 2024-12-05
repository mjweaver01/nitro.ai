<template>
  <div class="tab-container">
    <div class="tab-headers">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-header"
        :class="{ active: activeTab === index }"
        @click="setActiveTab(index)"
      >
        {{ tab.title }}
      </div>
    </div>
    <div class="tab-content">
      <component 
        v-if="tabs[activeTab]?.component"
        :is="tabs[activeTab].component" 
        v-bind="tabs[activeTab].props || {}"
      />
      <div v-else v-html="tabs[activeTab]?.content"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true,
      validator: (tabs) => tabs.every((tab) => tab.title && (tab.component || tab.content)),
    },
    initialTab: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      activeTab: this.initialTab,
    }
  },
  methods: {
    setActiveTab(index) {
      this.activeTab = index
      this.$emit('tab-changed', index)
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
  padding: 1em;
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