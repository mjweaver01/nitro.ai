<img src="./public/wsbb.png" width="50" />

# Nitro.ai (formerly Louie.ai)

[![Netlify Status](https://api.netlify.com/api/v1/badges/ecbff681-d90b-4a5b-9835-3e5678d32a21/deploy-status)](https://app.netlify.com/sites/nitroai/deploys)

> A knowledge base chatbot, pre-trained on WSBB's Shopify data

Pulling blog and product data from the Shopify Admin API.

Powered by [OpenAI](https://github.com/openai/openai-node) and [Langfuse](https://langfuse.com)

## 🏁 Quickstart

```bash
## one-liner
nvm use && yarn && yarn dev
```

## Useful links

- https://github.com/openai/openai-node
- https://github.com/langfuse/langfuse-js
- https://langfuse.com/docs/prompts/get-started#use-prompt
- https://github.com/langfuse/langfuse-docs/blob/main/pages/api/qa-chatbot.ts
- https://supabase.com/docs/reference/javascript/
- https://shopify.dev/docs/api/admin-graphql/

## &#129497;&#8205;&#9794;&#65039; Dev server

```bash
yarn dev
```

## 🟢 Production server

```bash
yarn start
```

## 🤖 LLM Server Methods

The LLM methods are lambda functions, located in the `functions` folder; they are currently hosted by Netlify. However, the server logic is located in `server`. It is relatively amorphous code, and can be adapted to AWS, GCP, Vercel, etc. easily.

NOTE: ensure you have `netlifi-cli` installed, and are signed in.

```bash
yarn netlify
```
