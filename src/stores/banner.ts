import { defineStore } from 'pinia'

export const useBannerStore = defineStore('banner', {
  state: () => {
    const isCyberMonday = new Date().getMonth() === 10 && new Date().getDate() >= 27
    const isBlackFriday = new Date().getMonth() === 10 && new Date().getDate() >= 22

    return {
      isCyberMonday,
      enable: false,
      message: isBlackFriday
        ? `
        <strong
          ><span style="color: #ff0000">Black Friday Sale On Now - </span
          ><span
            ><a
              style="color: #ffffff"
              href="https://www.westside-barbell.com/black-friday"
              >Shop Now</a
            ></span
          >
          <span style="color: #00ff26"></span
        ></strong>
        `
        : isCyberMonday
          ? `
        <strong
          ><span style="color: #00ff26">Cyber Monday Sale - </span
          ><span
            ><a
              style="color: #ffffff"
              href="https://www.westside-barbell.com/cyber-monday"
              >Shop Now</a
            ></span
          >
          <span style="color: #00ff26"></span
        ></strong>
      `
          : `
        <strong
          ><span style="color: #00ff26">Westside Barbell: Training Experience [Class:#002] - </span
          ><span
            ><a
              style="color: #ffffff"
              
              href="https://www.westside-barbell.com/products/westside-barbell-conjugate-strength-training-experience"
              >Enroll Today</a
            ></span
          >
          <span style="color: #00ff26"></span
        ></strong> 
      `,
    }
  },
})

// @todo
// want to pull products from shopify on the backend
// and display them here

// idea is to pull products with specific tag
