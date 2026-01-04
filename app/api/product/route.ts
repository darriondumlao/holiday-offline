import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock product data for testing the flow
    const mockProduct = {
      name: 'Holiday Collection Hoodie',
      images: [
        {
          url: '/h.png', // Using the existing logo as placeholder
          alt: 'Holiday Collection Hoodie - Front',
        },
        {
          url: '/h.png',
          alt: 'Holiday Collection Hoodie - Back',
        },
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      shopifyCheckoutUrl: 'https://holiday4nick.myshopify.com/cart/', // Placeholder URL
    }

    return NextResponse.json({
      product: mockProduct,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
