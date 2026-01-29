/**
 * API Route: /api/shopify/products
 *
 * Proxies product requests to Shopify Storefront API.
 * Uses Storefront Access Token for authentication.
 */

import { getStoreDomain, getStorefrontAccessToken } from '@/lib/shopify-auth'
import { NextResponse } from 'next/server'

// Storefront API version
const API_VERSION = '2024-01'

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
  }
}

interface ShopifyProductNode {
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

/**
 * GET /api/shopify/products
 * Fetches all products from Shopify using Storefront Access Token
 */
export async function GET() {
  const startTime = Date.now()
  console.log('[API/products] Request started')

  try {
    const storeDomain = getStoreDomain()
    const storefrontUrl = `https://${storeDomain}/api/${API_VERSION}/graphql.json`

    // Get Storefront Access Token
    const accessToken = getStorefrontAccessToken()

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
                  }
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch(storefrontUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Shopify-Storefront-Private-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API/products] Shopify API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch products from Shopify' },
        { status: response.status }
      )
    }

    const { data, errors } = await response.json()

    if (errors) {
      console.error('[API/products] GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 400 }
      )
    }

    // Transform Shopify data to our format
    const products = data.products.edges.map(
      (edge: { node: ShopifyProductNode }, index: number) => {
        const product = edge.node

        return {
          id: product.id,
          position: index + 1,
          name: product.title,
          description: product.description || 'No description available',
          image_url: product.images.edges[0]?.node.url || '',
          images: product.images.edges.map((imgEdge: ShopifyImageEdge) => ({
            url: imgEdge.node.url,
            altText: imgEdge.node.altText,
          })),
          variants: product.variants.edges.map((variantEdge: ShopifyVariantEdge) => {
            const variant = variantEdge.node
            return {
              id: variant.id,
              size: variant.title,
              price: parseFloat(variant.price.amount),
              currencyCode: variant.price.currencyCode,
              availableForSale: variant.availableForSale,
            }
          }),
          title: product.title,
        }
      }
    )

    const duration = Date.now() - startTime
    console.log(`[API/products] Success - ${products.length} products fetched in ${duration}ms`)

    return NextResponse.json({ products })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API/products] Error after ${duration}ms:`, error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
