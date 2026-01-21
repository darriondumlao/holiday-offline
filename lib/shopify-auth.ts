/**
 * Shopify Authentication Module
 *
 * Uses the Headless Channel approach:
 * - Storefront API token is pre-generated in Shopify Admin
 * - No dynamic token creation needed
 *
 * SECURITY: This file should ONLY be used server-side. Never import in client components.
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

/**
 * Validates that required environment variables are configured
 * @throws {Error} If required variables are missing
 */
function validateConfig(): void {
  const missing: string[] = []
  if (!SHOPIFY_STORE_DOMAIN) missing.push('SHOPIFY_STORE_DOMAIN')
  if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) missing.push('SHOPIFY_STOREFRONT_ACCESS_TOKEN')

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
 * Gets the Storefront Access Token from environment variables
 * @returns {string} The storefront access token
 */
export function getStorefrontAccessToken(): string {
  validateConfig()
  return SHOPIFY_STOREFRONT_ACCESS_TOKEN!
}
