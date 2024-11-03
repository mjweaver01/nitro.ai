import { createAdminApiClient } from '@shopify/admin-api-client'

export const shopify = createAdminApiClient({
  storeDomain: process.env.VITE_SHOPIFY_STORE,
  accessToken: process.env.VITE_SHOPIFY_ACCESS_TOKEN,
  apiVersion: '2024-10',
})

export const searchShopify = async (question: string, isProducts: boolean) => {
  const splitQ = question.match(/(.*?\s){3}/g)
  const shortenedQuestion = (splitQ ? splitQ[0] : question).toLowerCase().trim()
  console.log(
    `[shopify] searching "${shortenedQuestion}" (${isProducts ? 'products' : 'articles'})`,
  )

  const operation = isProducts
    ? `
    {
      products(first: 5, query:"status:active and *${shortenedQuestion}*") {
        edges {
          node {
            id
            title
            description
            handle
            onlineStoreUrl
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images (first:1) {
              edges {
                node {
                  url
                }
              }
            }
          }
          cursor
        }
      }
    }
  `
    : `
    {
      articles(first: 5, query:"status:active and*${shortenedQuestion}*") {
        edges {
          node {
            id
            title
            blog {
              handle
            }
            handle
            image {
              id
              url
            }
            body
          }
          cursor
        }
      }
    }
  `

  const { data } = await shopify.request(operation)
  const formattedData = formatShopifyData(data)
  console.log(`[shopify] found ${formattedData.length} results`)

  return formattedData
}

const formatShopifyData = (data) => {
  if (data?.products?.edges?.length > 0) {
    return data.products?.edges.map((node) => node.node)
  } else if (data?.articles?.edges?.length > 0) {
    return data.articles?.edges.map((node) => ({
      ...node.node,
      linkPath: `/blogs/${node.node.blog.handle}/${node.node.handle}`,
    }))
  }

  return []
}
