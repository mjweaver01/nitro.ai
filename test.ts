import 'dotenv/config'
import { searchShopify } from './server/clients/shopify'
import { askQuestion } from './server/ask'

const testShopify = async () => {
  await searchShopify('hat', true)
  await searchShopify('Lacrosse Strength and Conditioning', false)
}

const testQuestion = async () => {
  await askQuestion('give me 5 products', 'test_user', crypto.randomUUID())
}

testShopify()
testQuestion()
