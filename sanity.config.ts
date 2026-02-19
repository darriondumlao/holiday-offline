import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Holiday Landing Ticker',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  schema: {
    types: [
      {
        name: 'tickerMessage',
        title: 'Ticker Message',
        type: 'document',
        fields: [
          {
            name: 'text',
            title: 'Message Text',
            type: 'string',
            validation: (Rule) => Rule.required().max(200),
          },
          {
            name: 'isActive',
            title: 'Active',
            type: 'boolean',
            description: 'Only active messages will be displayed in the ticker',
            initialValue: true,
          },
          {
            name: 'order',
            title: 'Display Order',
            type: 'number',
            description: 'Lower numbers appear first',
            initialValue: 0,
          },
        ],
        preview: {
          select: {
            title: 'text',
            subtitle: 'isActive',
          },
          prepare(selection) {
            const { title, subtitle } = selection
            return {
              title: title,
              subtitle: subtitle ? '✓ Active' : '✗ Inactive',
            }
          },
        },
      },
      {
        name: 'downloadableContent',
        title: 'Downloadable Content Modal',
        type: 'document',
        fields: [
          {
            name: 'title',
            title: 'Modal Title',
            type: 'string',
            description: 'Title shown in the modal (e.g., "Content Available")',
            initialValue: 'Content Available',
          },
          {
            name: 'questionText',
            title: 'Question Text',
            type: 'text',
            description: 'The main question displayed in the modal',
            initialValue: 'Do your hands or your eyes create the moments people will remember you for?',
          },
          {
            name: 'downloadableImage',
            title: 'Downloadable Image',
            type: 'image',
            description: 'The image that users can download',
            validation: (Rule) => Rule.required(),
          },
          {
            name: 'downloadFileName',
            title: 'Download File Name',
            type: 'string',
            description: 'Name for the downloaded file (without extension)',
            initialValue: 'holiday-content',
          },
          {
            name: 'isActive',
            title: 'Active',
            type: 'boolean',
            description: 'Enable/disable the modal from appearing',
            initialValue: true,
          },
          {
            name: 'delaySeconds',
            title: 'Delay Before Showing (seconds)',
            type: 'number',
            description: 'How many seconds to wait before showing the modal',
            initialValue: 4,
            validation: (Rule) => Rule.min(0).max(30),
          },
        ],
        preview: {
          select: {
            title: 'title',
            subtitle: 'isActive',
            media: 'downloadableImage',
          },
          prepare(selection) {
            const { title, subtitle, media } = selection
            return {
              title: title,
              subtitle: subtitle ? '✓ Active' : '✗ Inactive',
              media: media,
            }
          },
        },
      },
      {
        name: 'product',
        title: 'Product',
        type: 'document',
        fields: [
          {
            name: 'name',
            title: 'Product Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
          },
          {
            name: 'images',
            title: 'Product Images',
            type: 'array',
            of: [
              {
                type: 'image',
                options: {
                  hotspot: true,
                },
                fields: [
                  {
                    name: 'alt',
                    title: 'Alternative Text',
                    type: 'string',
                  },
                ],
              },
            ],
            validation: (Rule) => Rule.required().min(1),
          },
          {
            name: 'sizes',
            title: 'Available Sizes',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'List of available sizes (e.g., XS, S, M, L, XL)',
            validation: (Rule) => Rule.required().min(1),
          },
          {
            name: 'shopifyCheckoutUrl',
            title: 'Shopify Checkout Base URL',
            type: 'url',
            description: 'Base Shopify checkout URL (variant will be appended)',
            validation: (Rule) => Rule.required(),
          },
          {
            name: 'isActive',
            title: 'Active',
            type: 'boolean',
            description: 'Show this product in the offline unlock section',
            initialValue: true,
          },
        ],
        preview: {
          select: {
            title: 'name',
            subtitle: 'isActive',
            media: 'images.0',
          },
          prepare(selection) {
            const { title, subtitle, media } = selection
            return {
              title: title,
              subtitle: subtitle ? '✓ Active' : '✗ Inactive',
              media: media,
            }
          },
        },
      },
      // Yearbook Photo — user-submitted photos from the photo booth
      {
        name: 'yearbookPhoto',
        title: 'Yearbook Photo',
        type: 'document',
        fields: [
          {
            name: 'image',
            title: 'Photo',
            type: 'image',
            validation: (Rule: any) => Rule.required(),
          },
          {
            name: 'approved',
            title: 'Approved',
            type: 'boolean',
            description: 'Only approved photos will appear in the yearbook gallery',
            initialValue: false,
          },
        ],
        preview: {
          select: {
            subtitle: 'approved',
            media: 'image',
          },
          prepare(selection: any) {
            const { subtitle, media } = selection
            return {
              title: 'Yearbook Photo',
              subtitle: subtitle ? '✓ Approved' : '⏳ Pending Review',
              media: media,
            }
          },
        },
      },
    ],
  },
})
