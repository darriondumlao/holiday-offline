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
    ],
  },
})
