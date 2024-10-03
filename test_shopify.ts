import { searchShopify } from './server/clients/shopify'

const testShopify = async () => {
  await searchShopify('hat', true)
  await searchShopify('Lacrosse Strength and Conditioning', false)
}

testShopify()
