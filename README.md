<img src="./public/wsbb.png" width="50" />

# Nitro.ai

[![Netlify Status](https://api.netlify.com/api/v1/badges/ecbff681-d90b-4a5b-9835-3e5678d32a21/deploy-status)](https://app.netlify.com/sites/louieai/deploys)

> A knowledge base chatbot, pre-trained on WSBB's blog, via sitemap XML

Using filtered results from [Westside Barbell's Shopify Blog Sitemap](https://raw.githubusercontent.com/mjweaver01/langchain-kb/master/src/assets/sitemap_blogs_1.xml)

Powered by [Langchain](https://js.langchain.com/) and [Langfuse](https://langfuse.com)

## 🏁 Quickstart

```bash
## one-liner
nvm use && yarn && yarn dev
```

## Useful links

- https://github.com/langchain-ai/langchainjs
- https://js.langchain.com/docs/modules/agents/tools/dynamic
- https://js.langchain.com/docs/modules/agents/how_to/custom_agent
- https://js.langchain.com/docs/integrations/document_loaders/web_loaders/sitemap
- https://js.langchain.com/v0.1/docs/modules/data_connection/retrievers/vectorstore/
- https://github.com/langfuse/langfuse-js
- https://langfuse.com/docs/prompts/get-started#use-prompt
- https://github.com/langfuse/langfuse-docs/blob/main/pages/api/qa-chatbot.ts
- https://supabase.com/docs/reference/javascript/

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
