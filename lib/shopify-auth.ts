/**
 * Shopify Authentication Module
 *
 * Uses the new Dev Dashboard app approach (post January 1, 2026):
 * 1. Client Credentials Grant to get Admin API access token
 * 2. Admin API to create Storefront Access Token (via storefrontAccessTokenCreate)
 * 3. Storefront Access Token for all Storefront API calls
 *
 * SECURITY: This file should ONLY be used server-side. Never import in client components.
 */

// Server-only environment variables (not exposed to client)
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET

// In-memory cache for tokens (per serverless function instance)
let adminTokenCache: {
  token: string | null
  expiresAt: number | null
} = {
  token: null,
  expiresAt: null,
}

let storefrontTokenCache: {
  token: string | null
} = {
  token: null,
}

/**
 * Validates that required environment variables are configured
 * @throws {Error} If required variables are missing
 */
function validateConfig(): void {
  const missing: string[] = []
  if (!SHOPIFY_STORE_DOMAIN) missing.push('SHOPIFY_STORE_DOMAIN')
  if (!SHOPIFY_CLIENT_ID) missing.push('SHOPIFY_CLIENT_ID')
  if (!SHOPIFY_CLIENT_SECRET) missing.push('SHOPIFY_CLIENT_SECRET')

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env.local file or Vercel environment settings.'
    )
  }
}

/**
 * Gets the Shopify store domain
 * @returns {string} The store domain
 */
export function getStoreDomain(): string {
  validateConfig()
  return SHOPIFY_STORE_DOMAIN!
}

/**
 * Gets an Admin API access token using Client Credentials Grant
 * This token is used to create Storefront Access Tokens
 *
 * @returns {Promise<string>} The admin API access token
 */
async function getAdminAccessToken(): Promise<string> {
  validateConfig()

  // Check cache (with 5 minute buffer before expiry)
  if (adminTokenCache.token && adminTokenCache.expiresAt) {
    const bufferMs = 5 * 60 * 1000 // 5 minutes
    if (Date.now() < adminTokenCache.expiresAt - bufferMs) {
      return adminTokenCache.token
    }
  }

  // Get new token via Client Credentials Grant
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
    const errorText = await response.text()
    console.error('Failed to get admin access token:', response.status, errorText)
    throw new Error(`Failed to get admin access token: ${response.status}`)
  }

  const data = await response.json()

  // Cache the token
  adminTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

/**
 * Creates or retrieves a Storefront Access Token
 * Uses Admin API's storefrontAccessTokenCreate mutation
 *
 * @returns {Promise<string>} The storefront access token
 */
export async function getStorefrontAccessToken(): Promise<string> {
  // Return cached token if available
  if (storefrontTokenCache.token) {
    return storefrontTokenCache.token
  }

  // First, try to get existing tokens
  const adminToken = await getAdminAccessToken()
  const adminApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`

  // Check for existing storefront access tokens
  const listQuery = `
    query {
      storefrontAccessTokens(first: 10) {
        edges {
          node {
            id
            title
            accessToken
          }
        }
      }
    }
  `

  const listResponse = await fetch(adminApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query: listQuery }),
  })

  if (listResponse.ok) {
    const listData = await listResponse.json()

    if (listData.data?.storefrontAccessTokens?.edges?.length > 0) {
      // Find existing token for our app
      const existingToken = listData.data.storefrontAccessTokens.edges.find(
        (edge: { node: { title: string; accessToken: string } }) =>
          edge.node.title === 'production-storefront-token'
      )

      if (existingToken) {
        storefrontTokenCache.token = existingToken.node.accessToken
        return storefrontTokenCache.token!
      }
    }
  }

  // Create a new storefront access token
  const createMutation = `
    mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        storefrontAccessToken {
          id
          title
          accessToken
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const createResponse = await fetch(adminApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      query: createMutation,
      variables: {
        input: {
          title: 'production-storefront-token',
        },
      },
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error('Failed to create storefront access token:', createResponse.status, errorText)
    throw new Error(`Failed to create storefront access token: ${createResponse.status}`)
  }

  const createData = await createResponse.json()

  if (createData.errors) {
    console.error('GraphQL errors creating storefront token:', createData.errors)
    throw new Error('GraphQL errors creating storefront access token')
  }

  if (createData.data?.storefrontAccessTokenCreate?.userErrors?.length > 0) {
    const errors = createData.data.storefrontAccessTokenCreate.userErrors
    console.error('User errors creating storefront token:', errors)
    throw new Error(
      `Failed to create storefront token: ${errors.map((e: { message: string }) => e.message).join(', ')}`
    )
  }

  const newToken = createData.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken
  storefrontTokenCache.token = newToken

  return newToken
}

/**
 * Clears all cached tokens
 * Useful for testing or when tokens need to be refreshed
 */
export function clearTokenCache(): void {
  adminTokenCache = {
    token: null,
    expiresAt: null,
  }
  storefrontTokenCache = {
    token: null,
  }
}
