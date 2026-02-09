/**
 * Utility functions for handling Shopify images
 *
 * Shopify CDN supports automatic format conversion and resizing through URL parameters.
 * This helps avoid issues with unsupported formats like HEIC.
 */

/**
 * Transform a Shopify image URL to ensure web-compatible format
 * Shopify's CDN can convert images to WebP/JPG on-the-fly
 *
 * @param url - Original Shopify image URL
 * @param options - Optional transformation options
 * @returns Transformed URL with format conversion
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number
    height?: number
    format?: 'jpg' | 'png' | 'webp'
  }
): string {
  if (!url) return url

  // Check if it's a Shopify CDN URL
  if (!url.includes('cdn.shopify.com')) {
    return url
  }

  try {
    const urlObj = new URL(url)

    // Shopify CDN uses filename modifications for transformations
    // Format: filename_WIDTHxHEIGHT.extension
    // Or query params for newer CDN URLs

    // For Shopify's newer URLs, we can add query params
    // width, height, format, crop, etc.

    if (options?.width) {
      urlObj.searchParams.set('width', options.width.toString())
    }

    if (options?.height) {
      urlObj.searchParams.set('height', options.height.toString())
    }

    // Force format conversion - this is key for HEIC images
    // Shopify will convert HEIC to the requested format
    if (options?.format) {
      urlObj.searchParams.set('format', options.format)
    } else {
      // Default to WebP for best compression/quality ratio
      // Falls back gracefully on older browsers
      urlObj.searchParams.set('format', 'webp')
    }

    return urlObj.toString()
  } catch {
    // If URL parsing fails, return original
    return url
  }
}

/**
 * Get srcSet for responsive images with Shopify CDN
 *
 * @param url - Original Shopify image URL
 * @param widths - Array of widths to generate
 * @returns srcSet string for responsive images
 */
export function getResponsiveSrcSet(
  url: string,
  widths: number[] = [280, 360, 560, 720, 1080]
): string {
  if (!url || !url.includes('cdn.shopify.com')) {
    return ''
  }

  return widths
    .map(w => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ')
}
