/** The author demo never authenticates against the production seller database. */
export function marketplaceDemoAvailable(env: { VERCEL_ENV?: string } = { VERCEL_ENV: process.env.VERCEL_ENV }): boolean {
  return env.VERCEL_ENV === "preview";
}
