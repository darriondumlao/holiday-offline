/**
 * API Route: /api/shopify/inventory
 *
 * Fetches inventory levels for a product using Shopify Admin API.
 * Returns total inventory, sold count, and available count.
 */

import { NextRequest, NextResponse } from 'next/server'

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET

// Admin API version
const API_VERSION = '2024-01'

// Cache for admin token
let adminTokenCache: {
  token: string | null
  expiresAt: number | null
} = {
  token: null,
  expiresAt: null,
}

// Cache for initial inventory (to calculate "sold")
// In production, you'd store this in a database
const initialInventoryCache: Record<string, number> = {}

/**
 * Gets an Admin API access token using Client Credentials Grant
 */
async function getAdminAccessToken(): Promise<string> {
  // Check cache (with 5 minute buffer before expiry)
  if (adminTokenCache.token && adminTokenCache.expiresAt) {
    const bufferMs = 5 * 60 * 1000
    if (Date.now() < adminTokenCache.expiresAt - bufferMs) {
      return adminTokenCache.token
    }
  }

  const tokenUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get admin access token: ${response.status}`)
  }

  const data = await response.json()

  adminTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

/**
 * GET /api/shopify/inventory?productId=...
 * Fetches inventory data for a product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId parameter' },
        { status: 400 }
      )
    }

    const adminToken = await getAdminAccessToken()
    const adminApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`

    // Query for product variants with inventory quantities
    const query = `
      query getProductInventory($id: ID!) {
        product(id: $id) {
          id
          title
          totalInventory
          variants(first: 50) {
            edges {
              node {
                id
                title
                inventoryQuantity
              }
            }
          }
        }
      }
    `

    const response = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        query,
        variables: { id: productId },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API/inventory] Admin API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: response.status }
      )
    }

    const { data, errors } = await response.json()

    if (errors) {
      console.error('[API/inventory] GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'GraphQL errors occurred', details: errors },
        { status: 400 }
      )
    }

    const product = data?.product
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate total current inventory
    const currentInventory = product.totalInventory || 0

    // Get or set initial inventory (for calculating "sold")
    // In production, store this in a database when product is first created
    if (!initialInventoryCache[productId]) {
      // First time seeing this product - use current as initial
      // You could also set a fixed initial value here
      initialInventoryCache[productId] = Math.max(currentInventory + 2, 22) // Default to at least 22 or current + some sold
    }

    const totalInventory = initialInventoryCache[productId]
    const available = currentInventory
    const sold = Math.max(0, totalInventory - available)

    return NextResponse.json({
      productId,
      totalInventory,
      available,
      sold,
      variants: product.variants.edges.map((edge: { node: { id: string; title: string; inventoryQuantity: number } }) => ({
        id: edge.node.id,
        title: edge.node.title,
        quantity: edge.node.inventoryQuantity,
      })),
    })
  } catch (error) {
    console.error('[API/inventory] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
