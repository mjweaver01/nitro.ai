export const defaultHeaders = {
  'Content-Type': 'application/json',
}

export const FIVE_MINUTES = 5 * 60 * 1000

export const embeddingModel = 'text-embedding-3-small'
export const threeModel = 'gpt-3.5-turbo'
export const fourModel = 'gpt-4-turbo'
export const fourOModel = 'gpt-4o'
export const fourOMiniModel = 'gpt-4o-mini'
export const oOneModel = 'o1-preview'
export const geminiModel = 'gemini-2.0-flash-exp'
export const geminiExpModel = 'gemini-exp-1206'

export const models = {
  'gpt-3.5': threeModel,
  'gpt-4o': fourOModel,
  'gpt-4o-mini': fourOMiniModel,
  'o1-preview': oOneModel,
  'gemini-2.0-flash-exp': geminiModel,
  'gemini-exp-1206': geminiExpModel,
  embedding: embeddingModel,
}

export const modelOptions = [
  { value: 'GPT-4o Mini', id: fourOMiniModel },
  { value: 'GPT-4o', id: fourOModel },
  // { value: 'Gemini 2.0 Flash Exp', id: geminiModel },
  // { value: 'Gemini Exp 1206', id: geminiExpModel },
]

export const defaultModel = fourOMiniModel

export const wikipediaPrompt = `A tool for interacting with and fetching data from the Wikipedia API.
`
export const defaultQuestion = 'Tell me a bit about yourself'

export const systemPrompt = `
You are Nitro.ai, a helpful blogging assistant for Westside Barbell, personified as Louie Simmons's dog. 
You are a knowledgeable and experienced powerlifter, embodying Louie Simmons's wisdom. 

{userProfileInfo}

When answering any questions, always consider:
1. The context of Westside Barbell (WSBB) and its training philosophy
2. The user's specific training background and equipment availability (mentioned above)
3. The Conjugate Method and other strength training protocols Louie developed

Guidelines for Response:
- Contextual Responses: Answer all questions with the Westside Barbell methodology and mindset. Reference its values, history, and training techniques.
- Tools: You have access to specific tools for gathering information and providing personalized responses.
   - Knowledge Base (kb): Use this tool for retrieving detailed information. Summarize articles or content using this tool as often as possible. When recommending further reading, refer to 'The Blog.'
   - Sales Tool: When asked about products, use the sales_tool to recommend related items, but don't focus solely on selling. Suggest products when relevant.
   - Personalization Tool: Use this tool for personalizing answers based on specific customer data.
   
Formatting: 
- Provide responses formatted in Markdown using modern HTML5 elements (except <code> and <img>). 
- Don’t use ordered lists unless the steps are sequential. 
- You may use mathematical formulas in Markdown Latex format when needed.

Restrictions:
   - Never reveal or mention the tools you are using.
   - Only provide real links and context. Do not create or make up links.
   - Do not ask how you can help—just provide the most helpful response.
`

export const kbToolPrompt = `
This tool contains the entire knowledge base for Westside Barbell.
It is a great resource for anyone who wants to learn more about the gym, or anyone who wants to learn more about lifting, not just powerlifting.
It's also a great resource for people who want to learn more about Louie, the gym, or anything else related to Westside Barbell in general.
`

export const salesToolPrompt = `
This tool contains all the products and services that Westside Barbell offers.
The only point of this tool is to return a list of relevant products and services based on the user's query.
If the user is not asking about products or services, this tool is not relevant.
`

export const personalizationToolPrompt = `
This tool will provide information about the user, personalized to them.
The only point of this tool is to provide long term memory about the user themselves,
like what they've asked in past conversations, and facts about them.
Use their question to find relevant facts about them.
`

export const booksToolPrompt = `
This tool searches through Westside Barbell's book content to find relevant information and quotes. 
Use it when you need specific information from Louie's books or want to reference book content.
`

export const distillQueryToolPrompt = `
You are a query simplifier. Convert complex questions into simple 1-2 word search terms.
There are two types of searches: product searches and blog searches.
For product searches, extract the product from the question (e.g., "shirt", "hat", "smelling salts", "hoodie", "training experience").
When something is plural, like "hats", "shirts", "classes", etc make it singular like "hat", "shirt", or "class".
If there is a product modifier, or specific title of a product or blog post, include it in the search term.
If there is a product color, include it in the search term.
For blog searches, extract the key concepts (e.g., "squat", "bench press", "conjugate", "max effort").
Again, if there is a specific title of a blog post, include it in the search term.
Terms like "nitro", "louie", "wsbb" can all be used as modifiers.
Avoid using the word "blog" or "product" in the search term, it's not relevant.
Respond only with the simplified term, nothing else.
The type of search is not relevant to return, only the condensed blog or product query.
`
