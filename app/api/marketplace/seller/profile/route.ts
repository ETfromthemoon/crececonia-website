import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";
import { normalizeChileanRut } from "@/lib/marketplace-seller-tax";

export async function POST(request: Request) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  const identityId = sellerIdentityFromRequest(request)!;
  const body = await request.json().catch(() => null);
  const name = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const bio = typeof body?.bio === "string" ? body.bio.trim() : "";
  const rut = normalizeChileanRut(body?.rut);
  const legalName = typeof body?.legalName === "string" ? body.legalName.trim() : "";
  const vatStatus = body?.vatStatus;
  if (name.length < 2 || name.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100 || bio.length > 2000 || body?.acceptTerms !== true) {
    return new Response("Datos del perfil inválidos", { status: 400 });
  }
  if (!rut || legalName.length < 3 || legalName.length > 160 || !["vat_registered", "not_registered", "unsure"].includes(vatStatus)) {
    return new Response("Datos tributarios inválidos", { status: 400 });
  }
  try {
    const rows = await queryDatabase<{ id: string }>(`with seller as (insert into marketplace_sellers
      (owner_user_id, public_slug, display_name, bio, status, terms_version, terms_accepted_at)
      values ($1, $2, $3, $4, 'pending_verification', 'marketplace-v1', now())
      on conflict (owner_user_id) do nothing returning id), tax as (
      insert into marketplace_seller_tax_profiles (seller_id, rut, legal_name, declared_vat_status)
      select id, $5, $6, $7 from seller returning seller_id), audit as (
      insert into marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
      select $1, 'seller_registered', 'seller', seller_id from tax returning entity_id as id)
      select id from audit`, [identityId, slug, name, bio, rut, legalName, vatStatus]);
    if (!rows[0]) return new Response("Ya tienes un perfil de autor", { status: 409 });
    return NextResponse.json({ ok: true, sellerId: rows[0].id }, { status: 201 });
  } catch (error) {
    if (String(error).includes("unique")) return new Response("Ese identificador público ya está ocupado", { status: 409 });
    console.error("marketplace_seller_profile_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo crear el perfil", { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  const identityId = sellerIdentityFromRequest(request)!;
  const body = await request.json().catch(() => null);
  const name = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const bio = typeof body?.bio === "string" ? body.bio.trim() : "";
  const rut = normalizeChileanRut(body?.rut);
  const legalName = typeof body?.legalName === "string" ? body.legalName.trim() : "";
  const vatStatus = body?.vatStatus;
  if (name.length < 2 || name.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
    || slug.length > 100 || bio.length > 2000 || !rut || legalName.length < 3
    || legalName.length > 160 || !["vat_registered", "not_registered", "unsure"].includes(vatStatus)
    || body?.acceptTerms !== true) return new Response("Datos del perfil inválidos", { status: 400 });
  try {
    const [changed] = await queryDatabase<{ id: string }>(`with seller as (
      update marketplace_sellers s
      set public_slug=$2, display_name=$3, bio=$4, status='pending_verification',
        terms_version='marketplace-v1', terms_accepted_at=now(), updated_at=now()
      where s.owner_user_id=$1 and s.status in ('pending_verification','rejected')
        and exists (select 1 from marketplace_seller_tax_profiles t
          where t.seller_id=s.id and t.review_status='rejected')
      returning s.id
    ), tax as (
      update marketplace_seller_tax_profiles t
      set rut=$5, legal_name=$6, declared_vat_status=$7,
        review_status='pending', reviewed_by=null, reviewed_at=null
      from seller s where t.seller_id=s.id returning t.seller_id
    ), audit as (
      insert into marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
      select $1,'seller_tax_resubmitted','seller',seller_id from tax
      returning entity_id as id
    ) select id from audit`, [identityId, slug, name, bio, rut, legalName, vatStatus]);
    if (!changed) return new Response("El perfil no está disponible para corrección", { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (String(error).includes("unique")) return new Response("RUT o identificador público ya utilizado", { status: 409 });
    console.error("marketplace_seller_profile_revision_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo reenviar el perfil", { status: 503 });
  }
}
