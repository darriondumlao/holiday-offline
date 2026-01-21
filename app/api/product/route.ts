import { NextResponse } from 'next/server'
import { getStoreDomain, getStorefrontAccessToken } from '@/lib/shopify-auth'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    const storeDomain = getStoreDomain()
    const storefrontUrl = `https://${storeDomain}/api/${API_VERSION}/graphql.json`

    // Get Storefront Access Token
    const accessToken = getStorefrontAccessToken()

    // Query for a specific product or the first available product
    const query = productId
      ? `
        {
          product(id: "${productId}") {
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
      `
      : `
        {
          products(first: 1) {
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
      console.error('[API/product] Shopify API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: response.status }
      )
    }

    const { data, errors } = await response.json()

    if (errors) {
      console.error('[API/product] GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 400 }
      )
    }

    // Get the product node (either from direct query or from products list)
    const productNode: ShopifyProductNode | null = productId
      ? data.product
      : data.products?.edges?.[0]?.node

    if (!productNode) {
      return NextResponse.json(
        { error: 'No product found' },
        { status: 404 }
      )
    }

    // Transform to our format
    const product = {
      id: productNode.id,
      title: productNode.title,
      name: productNode.title,
      description: productNode.description || '',
      imageUrl: productNode.images.edges[0]?.node.url || '',
      images: productNode.images.edges.map((imgEdge: ShopifyImageEdge) => ({
        url: imgEdge.node.url,
        altText: imgEdge.node.altText,
      })),
      price: parseFloat(productNode.variants.edges[0]?.node.price.amount || '0'),
      variants: productNode.variants.edges.map((variantEdge: ShopifyVariantEdge) => {
        const variant = variantEdge.node
        return {
          id: variant.id,
          size: variant.title,
          price: parseFloat(variant.price.amount),
          currencyCode: variant.price.currencyCode,
          availableForSale: variant.availableForSale,
          available: variant.availableForSale ? 1 : 0,
        }
      }),
      // Extract just sizes for backward compatibility
      sizes: productNode.variants.edges.map(
        (variantEdge: ShopifyVariantEdge) => variantEdge.node.title
      ),
      shopifyCheckoutUrl: `https://${storeDomain}/cart/`,
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[API/product] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
