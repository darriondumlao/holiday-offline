/**
 * Shopify Storefront API Client
 *
 * This module provides functions to interact with Shopify's Storefront API.
 *
 * AUTHENTICATION:
 * Uses the Headless Channel approach:
 * - Storefront API token is pre-generated in Shopify Admin
 * - No dynamic token creation needed
 *
 * ARCHITECTURE:
 * - Server Components: Use the server-side functions directly
 * - Client Components: Use the client-side functions (they call /api/shopify/* routes)
 */

import { getStoreDomain, getStorefrontAccessToken } from './shopify-auth'

// Storefront API version
const API_VERSION = '2024-01'

// Types
export interface ProductImage {
  url: string
  altText: string | null
}

export interface ProductVariant {
  id: string
  size: string
  price: number
  currencyCode: string
  availableForSale: boolean
  quantityAvailable: number
}

export interface Product {
  id: string
  position: number
  name: string
  description: string
  image_url: string
  images: ProductImage[]
  variants: ProductVariant[]
  title: string
}

interface ShopifyImageEdge {
  node: {
    url: string
    altText: string | null
  }
}

interface ShopifyVariantEdge {
  node: {
    id: string
    title: string
    price: {
      amount: string
      currencyCode: string
    }
    availableForSale: boolean
    quantityAvailable: number | null
  }
}

interface ShopifyProduct {
  id: string
  title: string
  description: string
  images: {
    edges: ShopifyImageEdge[]
  }
  variants: {
    edges: ShopifyVariantEdge[]
  }
}

// ============================================================================
// SERVER-SIDE FUNCTIONS (for Server Components and API Routes)
// ============================================================================

/**
 * Makes a GraphQL request to Shopify Storefront API (server-side only)
 * Uses Storefront Access Token for authentication.
 *
 * @param {string} query - GraphQL query or mutation
 * @param {object} variables - Query variables
 * @returns {Promise<any>} Response data
 */
async function shopifyFetch(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const storeDomain = getStoreDomain()
  const storefrontUrl = `https://${storeDomain}/api/${API_VERSION}/graphql.json`

  // Get Storefront Access Token
  const accessToken = getStorefrontAccessToken()

  const response = await fetch(storefrontUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Storefront-Private-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Shopify API error:', response.status, errorText)
    throw new Error(`Shopify API error: ${response.status}`)
  }

  const { data, errors } = await response.json()

  if (errors) {
    console.error('Shopify GraphQL errors:', errors)
    throw new Error('Failed to fetch from Shopify')
  }

  return data
}

/**
 * Transform raw Shopify product data to our app format
 */
function transformProduct(product: ShopifyProduct, index: number = 0): Product {
  return {
    id: product.id,
    position: index + 1,
    name: product.title,
    description: product.description || 'No description available',
    image_url: product.images.edges[0]?.node.url || '',
    images: product.images.edges.map((edge) => ({
      url: edge.node.url,
      altText: edge.node.altText,
    })),
    variants: product.variants.edges.map((variantEdge) => {
      const variant = variantEdge.node
      return {
        id: variant.id,
        size: variant.title,
        price: parseFloat(variant.price.amount),
        currencyCode: variant.price.currencyCode,
        availableForSale: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable ?? 0,
      }
    }),
    title: product.title,
  }
}

/**
 * Fetch all products from Shopify (SERVER-SIDE)
 * Use this in Server Components and API routes
 */
export async function fetchProducts(): Promise<Product[]> {
  const query = `
    {
      products(first: 50) {
        edges {
          node {
            id
            title
            description
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await shopifyFetch(query)
    return data.products.edges.map(
      (edge: { node: ShopifyProduct }, index: number) => transformProduct(edge.node, index)
    )
  } catch (error) {
    console.error('Error fetching products from Shopify:', error)
    throw error
  }
}

/**
 * Fetch a single product by ID (SERVER-SIDE)
 * Use this in Server Components and API routes
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const query = `
    query ProductById($id: ID!) {
      node(id: $id) {
        ... on Product {
          id
          title
          description
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await shopifyFetch(query, { id: productId })

    if (!data.node) {
      return null
    }

    return transformProduct(data.node, 0)
  } catch (error) {
    console.error('Error fetching product from Shopify:', error)
    throw error
  }
}

/**
 * Fetch products by collection handle (SERVER-SIDE)
 * Use this in Server Components and API routes
 */
export async function fetchProductsByCollection(collectionHandle: string): Promise<Product[]> {
  const query = `
    query CollectionProducts($handle: String!) {
      collection(handle: $handle) {
        id
        title
        products(first: 50) {
          edges {
            node {
              id
              title
              description
              images(first: 10) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 20) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await shopifyFetch(query, { handle: collectionHandle })

    if (!data.collection) {
      console.warn(`Collection with handle "${collectionHandle}" not found`)
      return []
    }

    return data.collection.products.edges.map(
      (edge: { node: ShopifyProduct }, index: number) => transformProduct(edge.node, index)
    )
  } catch (error) {
    console.error('Error fetching collection products from Shopify:', error)
    throw error
  }
}

/**
 * Create a cart and get checkout URL (SERVER-SIDE)
 * Use this in Server Components and API routes
 */
export async function createCheckout(
  lineItems: Array<{ variantId: string; quantity: number }>
): Promise<{ id: string; webUrl: string }> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 250) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                  }
                }
              }
            }
          }
        }
        userErrors {
          message
          field
        }
      }
    }
  `

  const variables = {
    input: {
      lines: lineItems.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      })),
    },
  }

  try {
    const data = await shopifyFetch(mutation, variables)

    if (data.cartCreate.userErrors.length > 0) {
      console.error('Cart user errors:', data.cartCreate.userErrors)
      const errorMessages = data.cartCreate.userErrors
        .map((e: { message: string }) => e.message)
        .join(', ')
      throw new Error(`Cart error: ${errorMessages}`)
    }

    return {
      id: data.cartCreate.cart.id,
      webUrl: data.cartCreate.cart.checkoutUrl,
    }
  } catch (error) {
    console.error('Error creating cart:', error)
    throw error
  }
}

// ============================================================================
// CLIENT-SIDE FUNCTIONS (for Client Components - use API routes)
// ============================================================================

/**
 * Fetch all products from Shopify (CLIENT-SIDE)
 * Use this in Client Components
 */
export async function fetchProductsClient(): Promise<Product[]> {
  const response = await fetch('/api/shopify/products')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch products')
  }

  const data = await response.json()
  return data.products
}

/**
 * Create a checkout (CLIENT-SIDE)
 * Use this in Client Components
 */
export async function createCheckoutClient(
  lineItems: Array<{ variantId: string; quantity: number }>
): Promise<{ id: string; webUrl: string }> {
  const response = await fetch('/api/shopify/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lineItems }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || 'Failed to create checkout')
  }

  return await response.json()
}

/**
 * Fetch products by collection handle (CLIENT-SIDE)
 * Use this in Client Components
 */
export async function fetchCollectionClient(collectionHandle: string): Promise<Product[]> {
  const response = await fetch(`/api/shopify/collection?handle=${encodeURIComponent(collectionHandle)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch collection')
  }

  const data = await response.json()
  return data.products
}
