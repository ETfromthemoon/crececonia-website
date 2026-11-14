/** The author demo never authenticates against the production seller database. */
export function marketplaceDemoAvailable(env: { VERCEL_ENV?: string } = { VERCEL_ENV: process.env.VERCEL_ENV }): boolean {
  return env.VERCEL_ENV === "preview";
}

/** Public seller listings require an explicit production launch after schema and payments are ready. */
export function marketplacePublicAvailable(env: { VERCEL_ENV?: string; MARKETPLACE_PUBLIC_ENABLED?: string } = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  MARKETPLACE_PUBLIC_ENABLED: process.env.MARKETPLACE_PUBLIC_ENABLED,
}): boolean {
  return marketplaceDemoAvailable(env) || env.MARKETPLACE_PUBLIC_ENABLED === "true";
}
