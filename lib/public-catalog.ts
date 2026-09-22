import catalog from "@/content/public-catalog.json";

export type PublicGuide = (typeof catalog.guides)[number];
export type PublicSkill = (typeof catalog.skills)[number];
export type PublicLink = (typeof catalog.links)[number];

export function listPublicGuides(category?: string): PublicGuide[] {
  return category ? catalog.guides.filter((item) => item.categoria === category) : catalog.guides;
}

export function getPublicGuide(slug: string): PublicGuide | null {
  return catalog.guides.find((item) => item.slug === slug) ?? null;
}

export function listPublicSkills(category?: string): PublicSkill[] {
  return category ? catalog.skills.filter((item) => item.categoria === category) : catalog.skills;
}

export function getPublicSkill(slug: string): PublicSkill | null {
  return catalog.skills.find((item) => item.slug === slug) ?? null;
}

export function listPublicLinks(): PublicLink[] {
  return catalog.links;
}
