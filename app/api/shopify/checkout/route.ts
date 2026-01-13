/**
 * API Route: /api/shopify/checkout
 *
 * Creates a Shopify cart and returns checkout URL.
 * Uses Storefront Access Token for authentication.
 */

import { getStoreDomain, getStorefrontAccessToken } from '@/lib/shopify-auth'
import { NextResponse } from 'next/server'

// Storefront API version
const API_VERSION = '2024-01'

interface LineItem {
  variantId: string
  quantity: number
}

/**
 * POST /api/shopify/checkout
 * Creates a cart with the provided line items and returns checkout URL
 * Uses Storefront Access Token for authentication.
 *
 * Request body:
 * {
 *   lineItems: [{ variantId: string, quantity: number }]
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lineItems } = body as { lineItems: LineItem[] }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: lineItems array is required' },
        { status: 400 }
      )
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.variantId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid line item: each item must have variantId and positive quantity' },
          { status: 400 }
        )
      }
    }

    const storeDomain = getStoreDomain()
    const storefrontUrl = `https://${storeDomain}/api/${API_VERSION}/graphql.json`

    // Get Storefront Access Token
    const accessToken = await getStorefrontAccessToken()

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

    const response = await fetch(storefrontUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API/checkout] Shopify API error:', response.status, errorText)
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: response.status })
    }

    const { data, errors } = await response.json()

    if (errors) {
      console.error('[API/checkout] GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'GraphQL errors occurred', details: errors },
        { status: 400 }
      )
    }

    if (data.cartCreate.userErrors.length > 0) {
      console.error('[API/checkout] User errors:', data.cartCreate.userErrors)
      const errorMessages = data.cartCreate.userErrors
        .map((e: { message: string }) => e.message)
        .join(', ')
      return NextResponse.json({ error: `Cart error: ${errorMessages}` }, { status: 400 })
    }

    return NextResponse.json({
      id: data.cartCreate.cart.id,
      webUrl: data.cartCreate.cart.checkoutUrl,
    })
  } catch (error) {
    console.error('[API/checkout] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
