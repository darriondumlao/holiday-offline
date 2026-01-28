import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { StartDropAction } from './sanity/actions/startDropAction'

export default defineConfig({
  name: 'default',
  title: 'Holiday Landing Ticker',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  document: {
    actions: (prev, context) => {
      // Add StartDropAction for limitedDrop documents
      if (context.schemaType === 'limitedDrop') {
        return [StartDropAction, ...prev]
      }
      return prev
    },
  },
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
        name: 'limitedDrop',
        title: 'Limited Drop Timer',
        type: 'document',
        fields: [
          {
            name: 'dropName',
            title: 'Drop Name',
            type: 'string',
            description: 'Name for this limited drop (e.g., "Winter 2025 Drop")',
            validation: (Rule) => Rule.required(),
          },
          {
            name: 'isActive',
            title: 'Drop Active',
            type: 'boolean',
            description: 'Is this drop currently active? Toggle on and click "Start Drop Now" to begin the 15-minute countdown.',
            initialValue: false,
          },
          {
            name: 'startedAt',
            title: 'Drop Started At',
            type: 'datetime',
            description: 'When the drop countdown started. Click "Start Drop Now" button to set this automatically.',
            readOnly: true,
          },
        ],
        preview: {
          select: {
            title: 'dropName',
            isActive: 'isActive',
            startedAt: 'startedAt',
          },
          prepare(selection) {
            const { title, isActive, startedAt } = selection
            const hasStarted = !!startedAt
            let subtitle = 'Inactive'
            if (isActive && hasStarted) {
              subtitle = '🔥 LIVE - Timer Running'
            } else if (isActive && !hasStarted) {
              subtitle = '⏸ Active - Click "Start Drop Now"'
            }
            return {
              title: title,
              subtitle: subtitle,
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
    ],
  },
})
