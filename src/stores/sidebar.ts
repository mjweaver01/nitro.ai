import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => {
    return {
      forceShow: localStorage.getItem('forceShow')
        ? localStorage.getItem('forceShow') === 'true'
        : false,
      desktopHide: localStorage.getItem('desktopHide')
        ? localStorage.getItem('desktopHide') === 'true'
        : false,
    }
  },
  actions: {
    setForceShow(show) {
      this.forceShow = show
      localStorage.setItem('forceShow', show ? 'true' : 'false')
    },
    setDesktopHide(hide) {
      this.desktopHide = hide
      localStorage.setItem('desktopHide', hide ? 'true' : 'false')
    },
  },
})
