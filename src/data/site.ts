export const site = {
  name: 'Roots & Relics Greenhouse',
  logo: {
    light: 'https://vdbjlgmbpykjblprqnak.supabase.co/storage/v1/object/public/website-assets-public/65c78021-2652-4e64-b025-485262709d8a/66d974bc-8c88-41fd-9bb3-cf74315325ac/v1-roots-relics-logo-light.png',
    dark: 'https://vdbjlgmbpykjblprqnak.supabase.co/storage/v1/object/public/website-assets-public/65c78021-2652-4e64-b025-485262709d8a/0ac1da37-2116-4b54-b87e-bbbeb2b928fb/v1-roots-relics-logo-dark.png',
  },
  contact: {
    phoneDisplay: '541.678.8687',
    phoneHref: '5416788687',
    email: 'rootsandrelics.greenhouse@gmail.com',
    instagram: 'rootsandrelicsgreenhouse',
  },
  primaryNavigation: [
    { label: 'Our story', href: '/our-story/' },
    { label: 'The collection', href: '/the-collection/' },
    { label: 'Gatherings', href: '/greenhouse-gatherings/' },
    { label: 'Private showings', href: '/private-showings/' },
    { label: 'Gallery', href: '/gallery/' },
    { label: 'Journal', href: '/from-the-greenhouse/' },
  ],
  secondaryNavigation: [
    { label: 'Before you visit', href: '/before-you-visit/' },
    { label: 'FAQ', href: '/faq/' },
    { label: 'Contact', href: '/contact/' },
  ],
} as const;

export type SitePath =
  | '/'
  | (typeof site.primaryNavigation)[number]['href']
  | (typeof site.secondaryNavigation)[number]['href'];
