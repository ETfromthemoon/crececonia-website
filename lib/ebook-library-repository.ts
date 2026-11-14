import "server-only";
import { queryDatabase } from "./database";
import { EBOOK_LIBRARY_CHALLENGE_TTL_SECONDS, isEbookLibraryEnabled } from "./ebook-library-config";
import { getCatalogEntry } from "./ebook-catalog";

function assertEnabled() { if (!isEbookLibraryEnabled()) throw new Error("EBOOK_LIBRARY_DISABLED"); }
type Row = Record<string, unknown>;

export async function reserveRequest(emailKey: string, ipKey: string): Promise<boolean> {
  assertEnabled();
  const rows = await queryDatabase<Row>("select commerce.reserve_ebook_library_request($1,$2) as allowed", [emailKey, ipKey]);
  if (typeof rows[0]?.allowed !== "boolean") throw new Error("EBOOK_LIBRARY_SCHEMA_UNAVAILABLE");
  return rows[0].allowed;
}

export async function createChallenge(tokenHash: string, email: string): Promise<void> {
  assertEnabled();
  await queryDatabase("insert into commerce.ebook_library_challenges(token_hash,email,expires_at) values($1,$2,now()+($3 * interval '1 second'))", [tokenHash,email,EBOOK_LIBRARY_CHALLENGE_TTL_SECONDS]);
}

export async function consumeChallenge(tokenHash: string, sessionHash: string): Promise<boolean> {
  assertEnabled();
  const rows = await queryDatabase<Row>("select commerce.consume_ebook_library_challenge($1,$2) as expires_at", [tokenHash,sessionHash]);
  return Boolean(rows[0]?.expires_at);
}

export async function getLibraryResources(email: string): Promise<{ resource: string; title: string }[]> {
  assertEnabled();
  const rows = await queryDatabase<Row>("select distinct resource from commerce.ebook_purchases where lower(btrim(email))=$1 order by resource",[email]);
  return rows.map(row => {
    if (typeof row.resource !== "string" || !/^ebook:[a-z0-9-]{1,160}$/.test(row.resource)) throw new Error("EBOOK_LIBRARY_INVALID_PURCHASE_RESOURCE");
    const slug = row.resource.slice("ebook:".length);
    const title = getCatalogEntry(row.resource)?.title ?? slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
    return { resource: row.resource, title };
  });
}

export async function getSessionEmail(sessionHash: string): Promise<string | null> {
  assertEnabled();
  const rows = await queryDatabase<Row>("select email from commerce.ebook_library_sessions where session_hash=$1 and revoked_at is null and expires_at>now() limit 1",[sessionHash]);
  if (!rows.length) return null;
  if (typeof rows[0].email !== "string") throw new Error("EBOOK_LIBRARY_INVALID_SESSION");
  return rows[0].email;
}

export async function ownsResource(email:string,resource:string):Promise<boolean>{
  assertEnabled();
  const rows=await queryDatabase<Row>("select exists(select 1 from commerce.ebook_purchases where lower(btrim(email))=$1 and resource=$2) as owned",[email,resource]);
  if(typeof rows[0]?.owned!=="boolean")throw new Error("EBOOK_LIBRARY_SCHEMA_UNAVAILABLE");
  return rows[0].owned;
}

export async function revokeSession(sessionHash:string):Promise<void>{
  assertEnabled();
  await queryDatabase("select commerce.revoke_ebook_library_session($1)",[sessionHash]);
}
