import { defineStore } from 'pinia'

export const useBannerStore = defineStore('banner', {
  state: () => {
    return {
      enable: true,
      message: `
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
