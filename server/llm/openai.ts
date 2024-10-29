import { functions } from '../tools'
import { fourOModel, threeModel } from '../constants'

export const llm = (newModel: boolean = false) =>
  new ChatOpenAI({
    model: newModel ? fourOModel : threeModel,
    openAIApiKey: process.env.VITE_OPENAI_API_KEY,
    temperature: 0,
    streaming: true,
  })

export const modelWithFunctions = llm(true).bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
})

export const kbModelWithFunctions = llm(true).bind({
  functions: kbTools.map((tool) => convertToOpenAIFunction(tool)),
})
