import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea' },
  ],
}
