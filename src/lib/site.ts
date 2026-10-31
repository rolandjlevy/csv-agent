// Single source of truth for the maker links and contact details used in the
// footer, the About dialog and the "Get in touch" prompt.
export const SITE = {
  name: 'Statement Sorter',
  url: 'https://statementsorter.co.uk',
  repo: 'https://github.com/rolandjlevy/csv-agent',
  maker: 'Roland Levy',
  contactEmail: 'rolandjlevy@gmail.com',
  contactSubject: 'Statement Sorter',
  github: 'https://github.com/rolandjlevy',
  linkedin: 'https://www.linkedin.com/in/roland-levy/',
  portfolio: 'https://rolandlevy.co.uk/',
} as const;

export const CONTACT_HREF = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
  SITE.contactSubject
)}`;
