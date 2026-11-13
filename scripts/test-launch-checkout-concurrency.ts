import { createHash, randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "@neondatabase/serverless";

const API_BASE = "https://console.neon.tech/api/v2";
const WAIT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 150;
const CONNECTION_TIMEOUT_MS = 10_000;

type NeonBranch = {
  id: string;
  parent_id?: string | null;
  default?: boolean;
  primary?: boolean;
  current_state?: string;
};

type NeonEndpoint = {
  branch_id: string;
  host: string;
  type: string;
  disabled?: boolean;
};

function help(): void {
  console.log(`Prueba de concurrencia multi-sesión para checkout de lanzamientos (migración 007).

Uso:
  npm run launch:checkout:concurrency -- --confirm-temporary-neon

Requiere estas variables locales:
  LAUNCH_CHECKOUT_TEMP_DATABASE_URL  URL directa de una rama Neon temporal
  DATABASE_URL                      host de producción de referencia (sólo comparación; nunca conectado)
  NEON_API_KEY                      clave para verificaciones GET de la API Neon
  LAUNCH_CHECKOUT_NEON_PROJECT_ID   proyecto Neon explícito
  LAUNCH_CHECKOUT_NEON_BRANCH_ID    rama temporal explícita

Seguridad:
  - No aplica migraciones ni ejecuta down.sql.
  - Exige --confirm-temporary-neon en cada ejecución.
  - Verifica por API que la rama no sea la principal, cuelgue de la principal y que el host
    de conexión pertenezca a un endpoint read-write de esa rama.
  - Rechaza la URL/host de producción. Sólo borra fixtures aleatorios propios, al final.
  - No imprime URLs, claves, correos ni filas de órdenes.

Local:
  --self-test  verifica las guardas con datos sintéticos, sin variables de entorno ni conexión.
  --help       muestra esta ayuda, sin variables de entorno ni conexión.
`);
}

function fail(message: string): never {
  throw new Error(message);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) fail(`Falta la variable requerida ${name}.`);
  return value;
}

function parseNeonConnectionUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(`${label} no es una URL válida.`);
  }
  if (!(["postgres:", "postgresql:"].includes(url.protocol)) || !url.hostname) {
    fail(`${label} debe ser una URL PostgreSQL.`);
  }
  if (!url.hostname.toLowerCase().endsWith(".neon.tech")) {
    fail(`${label} debe apuntar a un host Neon reconocido.`);
  }
  return url;
}

function canonicalNeonHost(host: string): string {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  const [endpoint, ...domain] = normalized.split(".");
  return [endpoint.replace(/-pooler$/, ""), ...domain].join(".");
}

function assertSafeTargetMetadata(
  targetHost: string,
  productionHost: string,
  branchId: string,
  targetBranch: NeonBranch,
  parentBranch: NeonBranch | undefined,
  endpoints: NeonEndpoint[],
): void {
  if (targetHost === productionHost) fail("Ejecución bloqueada: la URL temporal coincide con el host de producción.");
  if (targetBranch.id !== branchId || targetBranch.default === true || targetBranch.primary === true) {
    fail("Ejecución bloqueada: la rama indicada es default/principal o no coincide con la rama verificada.");
  }
  if (!targetBranch.parent_id || targetBranch.current_state !== "ready") {
    fail("La rama indicada no es una rama temporal lista y activa.");
  }
  if (!parentBranch || parentBranch.id !== targetBranch.parent_id || parentBranch.current_state !== "ready"
      || (parentBranch.default !== true && parentBranch.primary !== true)) {
    fail("La rama temporal no deriva directamente de la rama principal/default del proyecto.");
  }

  const endpointForHost = (host: string) => endpoints.find((endpoint) =>
    canonicalNeonHost(endpoint.host) === host,
  );
  const targetEndpoint = endpointForHost(targetHost);
  if (!targetEndpoint || targetEndpoint.branch_id !== targetBranch.id
      || targetEndpoint.type !== "read_write" || targetEndpoint.disabled === true) {
    fail("El host configurado no coincide con un endpoint read-write habilitado de la rama temporal indicada.");
  }

  const productionEndpoint = endpointForHost(productionHost);
  if (productionEndpoint?.branch_id === targetBranch.id) {
    fail("Ejecución bloqueada: DATABASE_URL resuelve a la rama temporal elegida.");
  }
}

function selfTest(): void {
  const targetUrl = parseNeonConnectionUrl("postgresql://safe@ep-temp-example.us-east-2.aws.neon.tech/db", "test URL");
  const productionUrl = parseNeonConnectionUrl("postgresql://prod@ep-prod-example.us-east-2.aws.neon.tech/db", "test URL");
  const targetBranch: NeonBranch = { id: "br-temp", parent_id: "br-main", default: false, current_state: "ready" };
  const parentBranch: NeonBranch = { id: "br-main", default: true, current_state: "ready" };
  const endpoints: NeonEndpoint[] = [
    { branch_id: "br-temp", host: "ep-temp-example.us-east-2.aws.neon.tech", type: "read_write" },
    { branch_id: "br-main", host: "ep-prod-example.us-east-2.aws.neon.tech", type: "read_write" },
  ];

  if (canonicalNeonHost("ep-temp-example-pooler.us-east-2.aws.neon.tech") !== targetUrl.hostname) {
    fail("Self-test falló al normalizar el host Neon pooler.");
  }
  assertSafeTargetMetadata(
    canonicalNeonHost(targetUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-temp", targetBranch, parentBranch, endpoints,
  );

  const mustReject = (operation: () => void, name: string) => {
    try { operation(); } catch { return; }
    fail(`Self-test falló: debía rechazar ${name}.`);
  };
  mustReject(() => assertSafeTargetMetadata(
    canonicalNeonHost(productionUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-temp", targetBranch, parentBranch, endpoints,
  ), "host igual a producción");
  mustReject(() => assertSafeTargetMetadata(
    canonicalNeonHost(targetUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-main", parentBranch, undefined, endpoints,
  ), "rama principal");
  mustReject(() => assertSafeTargetMetadata(
    canonicalNeonHost(targetUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-temp", targetBranch, { id: "br-other", default: false }, endpoints,
  ), "parent no principal");
  mustReject(() => assertSafeTargetMetadata(
    canonicalNeonHost(targetUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-temp", { ...targetBranch, current_state: "init" }, parentBranch, endpoints,
  ), "rama no lista");
  mustReject(() => assertSafeTargetMetadata(
    canonicalNeonHost(targetUrl.hostname), canonicalNeonHost(productionUrl.hostname),
    "br-temp", targetBranch, parentBranch,
    [{ ...endpoints[0], type: "read_only" }, endpoints[1]],
  ), "endpoint read-only");
  console.log("PASS: guardas locales de URL, host pooler, rama temporal, parent y endpoint (sin leer variables ni conectar).");
}

function safeId(value: string, name: string): string {
  if (!/^[a-z0-9-]{1,80}$/i.test(value)) fail(`${name} tiene un formato inválido.`);
  return encodeURIComponent(value);
}

function safeErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : "Error no identificado en el harness.";
  for (const secret of [
    process.env.DATABASE_URL,
    process.env.NEON_API_KEY,
    process.env.LAUNCH_CHECKOUT_TEMP_DATABASE_URL,
  ]) {
    if (secret) message = message.split(secret).join("[redacted]");
  }
  return message.replace(/postgres(?:ql)?:\/\/[^\s)]+/gi, "[redacted database URL]");
}

async function neonGet<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(CONNECTION_TIMEOUT_MS),
  });
  if (!response.ok) fail(`Neon API no pudo verificar el destino temporal (HTTP ${response.status}).`);
  return (await response.json()) as T;
}

async function verifyTemporaryTarget(): Promise<{
  connectionString: string;
}> {
  if (!process.argv.includes("--confirm-temporary-neon")) {
    fail("Ejecución bloqueada: agrega --confirm-temporary-neon sólo para una rama temporal aislada.");
  }

  const connectionString = requiredEnv("LAUNCH_CHECKOUT_TEMP_DATABASE_URL");
  const productionConnectionString = requiredEnv("DATABASE_URL");
  const apiKey = requiredEnv("NEON_API_KEY");
  const projectId = safeId(requiredEnv("LAUNCH_CHECKOUT_NEON_PROJECT_ID"), "LAUNCH_CHECKOUT_NEON_PROJECT_ID");
  const branchId = safeId(requiredEnv("LAUNCH_CHECKOUT_NEON_BRANCH_ID"), "LAUNCH_CHECKOUT_NEON_BRANCH_ID");
  const targetUrl = parseNeonConnectionUrl(connectionString, "LAUNCH_CHECKOUT_TEMP_DATABASE_URL");
  const productionUrl = parseNeonConnectionUrl(productionConnectionString, "DATABASE_URL");
  const targetHost = canonicalNeonHost(targetUrl.hostname);
  const productionHost = canonicalNeonHost(productionUrl.hostname);

  if (targetUrl.href === productionUrl.href || targetHost === productionHost) {
    fail("Ejecución bloqueada: la URL temporal coincide con la URL/host de producción.");
  }

  const projectPath = `/projects/${projectId}`;
  const branchPath = `${projectPath}/branches/${branchId}`;
  const [branchResponse, endpointsResponse] = await Promise.all([
    neonGet<{ branch?: NeonBranch }>(branchPath, apiKey),
    neonGet<{ endpoints?: NeonEndpoint[] }>(`${projectPath}/endpoints`, apiKey),
  ]);
  const targetBranch = branchResponse.branch;
  if (!targetBranch || targetBranch.id !== decodeURIComponent(branchId)) {
    fail("Neon API no devolvió la rama indicada; no se abrirá una conexión SQL.");
  }
  const parentResponse = targetBranch.parent_id
    ? await neonGet<{ branch?: NeonBranch }>(`${projectPath}/branches/${safeId(targetBranch.parent_id, "parent_id")}`, apiKey)
    : undefined;
  const parentBranch = parentResponse?.branch;
  const endpointsResponseData = endpointsResponse;
  if (!Array.isArray(endpointsResponseData.endpoints)) {
    fail("Neon API devolvió una lista de endpoints no reconocida; no se abrirá una conexión SQL.");
  }
  assertSafeTargetMetadata(
    targetHost, productionHost, decodeURIComponent(branchId), targetBranch, parentBranch, endpointsResponseData.endpoints,
  );

  return { connectionString };
}

function newKey(): { raw: string; hash: Buffer } {
  const raw = randomUUID();
  return { raw, hash: createHash("sha256").update(raw, "utf8").digest() };
}

function newOrder(): string {
  return `launch-${randomUUID()}`;
}

function newSlug(prefix: string): string {
  return `${prefix}-${randomUUID().replaceAll("-", "")}`;
}

async function waitUntilBlocked(
  monitor: PoolClient,
  marker: string,
): Promise<void> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await monitor.query<{ pid: number; wait_event_type: string; query: string }>(
      `select pid, wait_event_type, query
         from pg_catalog.pg_stat_activity
        where wait_event_type = 'Lock'
          and state = 'active'
          and query like $1
          and pid <> pg_catalog.pg_backend_pid()
        limit 1`,
      [`%${marker}%`],
    );
    if (result.rows.length === 1) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  fail("La segunda sesión no apareció esperando un lock; el test no demostró contención real.");
}

async function assertMigrationInstalled(client: PoolClient): Promise<void> {
  // has_table_privilege checks effective privileges, including grants to PUBLIC,
  // for both browser-facing roles, covering direct and PUBLIC ACL entries.
  const result = await client.query<{ ready: boolean; public_access_revoked: boolean }>(`
    select to_regclass('commerce.launch_checkout_orders') is not null
       and to_regprocedure('commerce.reserve_launch_checkout(text,bytea,text,text)') is not null
       and to_regprocedure('commerce.fail_launch_checkout_creation(text)') is not null as ready,
       not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'SELECT')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'INSERT')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'UPDATE')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'DELETE')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'TRUNCATE')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'REFERENCES')
       and not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'TRIGGER')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'SELECT')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'INSERT')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'UPDATE')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'DELETE')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'TRUNCATE')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'REFERENCES')
       and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'TRIGGER')
       and (current_setting('server_version_num')::integer < 170000
            or (not has_table_privilege('anon', 'commerce.launch_checkout_orders', 'MAINTAIN')
                and not has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'MAINTAIN')))
       and not has_function_privilege('anon', 'commerce.reserve_launch_checkout(text,bytea,text,text)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.reserve_launch_checkout(text,bytea,text,text)', 'EXECUTE')
       and not has_function_privilege('anon', 'commerce.attach_launch_flow_order(text,bigint)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.attach_launch_flow_order(text,bigint)', 'EXECUTE')
       and not has_function_privilege('anon', 'commerce.mark_launch_checkout_creation_submitted(text)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.mark_launch_checkout_creation_submitted(text)', 'EXECUTE')
       and not has_function_privilege('anon', 'commerce.fail_launch_checkout_creation(text)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.fail_launch_checkout_creation(text)', 'EXECUTE')
       and not has_function_privilege('anon', 'commerce.mark_launch_checkout_creation_unknown(text)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.mark_launch_checkout_creation_unknown(text)', 'EXECUTE')
       and not has_function_privilege('anon', 'commerce.record_launch_flow_status(text,bigint,integer,text,integer)', 'EXECUTE')
       and not has_function_privilege('authenticated', 'commerce.record_launch_flow_status(text,bigint,integer,text,integer)', 'EXECUTE')
       as public_access_revoked
  `);
  if (result.rows[0]?.ready !== true) {
    fail("La migración 007 no está instalada en la rama verificada; no se modificarán tablas.");
  }
  if (result.rows[0]?.public_access_revoked !== true) {
    fail("Las ACL públicas de la tabla/RPC de checkout no están revocadas; no se modificarán tablas.");
  }
}

async function insertFixture(
  client: PoolClient,
  launchId: string,
  tierId: string,
  slug: string,
  resource: string,
  capacity: number,
): Promise<{ launchId: string; tierId: string; slug: string; resource: string }> {
  await client.query("begin");
  try {
    await client.query(
      `insert into public.launches (id, slug, name, launch_type, status, headline, description)
       values ($1, $2, 'Checkout concurrency fixture', 'ebook_release', 'published', 'Fixture', '')`,
      [launchId, slug],
    );
    await client.query(
      `insert into public.launch_products (launch_id, resource, title_snapshot, role, sort_order)
       values ($1, $2, 'Concurrency fixture', 'primary', 0)`,
      [launchId, resource],
    );
    await client.query(
      `insert into public.launch_price_tiers
         (id, launch_id, label, amount_minor, capacity, sold_count, reserved_count, sort_order, status)
       values ($1, $2, 'Concurrency fixture', 100, $3, 0, 0, 0, 'active')`,
      [tierId, launchId, capacity],
    );
    await client.query("commit");
  } catch (error) {
    try { await client.query("rollback"); } catch { /* caller keeps deterministic fixture IDs for recovery */ }
    throw error;
  }
  return { launchId, tierId, slug, resource };
}

async function callReservation(
  client: PoolClient,
  marker: string,
  order: string,
  keyHash: Buffer,
  slug: string,
): Promise<{ commerce_order: string }> {
  const result = await client.query<{ result: { commerce_order: string } }>(
    `/* ${marker} */ select commerce.reserve_launch_checkout($1, $2, $3, $4) as result`,
    [order, keyHash, slug, "checkout-concurrency@example.test"],
  );
  const value = result.rows[0]?.result;
  if (!value || typeof value.commerce_order !== "string") {
    fail("La RPC de reserva no devolvió el contrato esperado.");
  }
  return value;
}

async function cleanupFixtures(
  pool: Pool,
  fixtures: Array<{ launchId: string; tierId: string; slug: string; resource: string }>,
  orders: string[],
): Promise<void> {
  if (fixtures.length === 0) return;
  const client = await pool.connect();
  try {
    const launchIds = fixtures.map((fixture) => fixture.launchId);
    const tierIds = fixtures.map((fixture) => fixture.tierId);
    const fixtureByLaunch = new Map(fixtures.map((fixture) => [fixture.launchId, fixture]));
    const launchRows = await client.query<{ id: string; slug: string }>(
      "select id, slug from public.launches where id = any($1::uuid[])",
      [launchIds],
    );
    for (const row of launchRows.rows) {
      if (fixtureByLaunch.get(row.id)?.slug !== row.slug) fail("Un lanzamiento fixture no coincide con sus UUID/slug; se preservaron los datos.");
    }

    const tierRows = await client.query<{ id: string; launch_id: string }>(
      "select id, launch_id from public.launch_price_tiers where id = any($1::uuid[])",
      [tierIds],
    );
    for (const row of tierRows.rows) {
      if (fixtureByLaunch.get(row.launch_id)?.tierId !== row.id) fail("Un tramo no coincide con sus UUID de fixture; se preservaron los datos.");
    }
    const productRows = await client.query<{ launch_id: string; resource: string }>(
      "select launch_id, resource from public.launch_products where launch_id = any($1::uuid[])",
      [launchIds],
    );
    for (const row of productRows.rows) {
      if (fixtureByLaunch.get(row.launch_id)?.resource !== row.resource) fail("Un producto no coincide con sus UUID/resource fixture; se preservaron los datos.");
    }

    const ownedOrders = await client.query<{
      commerce_order: string; launch_id: string; tier_id: string; status: string; capacity_held: boolean; flow_order: string | null;
    }>(
      `select commerce_order, launch_id, tier_id, status, capacity_held, flow_order::text as flow_order
         from commerce.launch_checkout_orders where commerce_order = any($1::text[])`,
      [orders],
    );
    for (const row of ownedOrders.rows) {
      const fixture = fixtureByLaunch.get(row.launch_id);
      if (!fixture || row.tier_id !== fixture.tierId || !orders.includes(row.commerce_order)) {
        fail("Una orden no pertenece a los UUID/identificadores generados por el harness; se preservaron los datos.");
      }
      if (!["creating", "creation_submitted", "creation_failed"].includes(row.status)
          || row.flow_order !== null || (row.status === "creation_failed" && row.capacity_held)) {
        fail("Una orden del harness alcanzó un estado no reversible seguro; se preservaron sus datos.");
      }
    }
    const foreignOrders = await client.query<{ count: number }>(
      `select count(*)::int as count from commerce.launch_checkout_orders
        where launch_id = any($1::uuid[]) and commerce_order <> all($2::text[])`,
      [launchIds, orders],
    );
    if ((foreignOrders.rows[0]?.count ?? 0) !== 0) {
      fail("El fixture tiene órdenes ajenas a este harness; se preservaron los datos.");
    }

    const ownedOrderIds = ownedOrders.rows.map((row) => row.commerce_order);
    const manifests = await client.query<{ commerce_order: string; resources: unknown }>(
      "select commerce_order, resources from commerce.ebook_pending_orders where commerce_order = any($1::text[])",
      [orders],
    );
    for (const manifest of manifests.rows) {
      const owner = ownedOrders.rows.find((row) => row.commerce_order === manifest.commerce_order);
      const fixture = owner && fixtureByLaunch.get(owner.launch_id);
      const resources = Array.isArray(manifest.resources) ? manifest.resources : null;
      if (!fixture || !resources || resources.length !== 1
          || typeof resources[0] !== "object" || resources[0] === null
          || (resources[0] as Record<string, unknown>).resource !== fixture.resource
          || (resources[0] as Record<string, unknown>).tier !== "regular"
          || (resources[0] as Record<string, unknown>).amount !== 100) {
        fail("Un manifiesto no coincide con una orden y resource fixture propios; se preservaron los datos.");
      }
    }

    for (const row of ownedOrders.rows) {
      if (row.status !== "creation_failed") {
        await client.query("select commerce.fail_launch_checkout_creation($1)", [row.commerce_order]);
      }
    }

    const remaining = await client.query<{ count: number }>(
      `select count(*)::int as count from commerce.launch_checkout_orders
        where commerce_order = any($1::text[])
          and (status <> 'creation_failed' or capacity_held or flow_order is not null)`,
      [orders],
    );
    if ((remaining.rows[0]?.count ?? 0) !== 0) {
      fail("No se limpiaron todas las reservas de prueba de forma segura; se preservaron sus fixtures.");
    }

    const manifest = await client.query<{ count: number }>(
      `select count(*)::int as count from commerce.ebook_pending_orders where commerce_order = any($1::text[])`,
      [orders],
    );
    if ((manifest.rows[0]?.count ?? 0) !== 0) fail("Quedó un manifiesto pendiente del harness; se preservaron fixtures.");

    const capacity = await client.query<{ count: number }>(
      "select count(*)::int as count from public.launch_price_tiers where id = any($1::uuid[]) and reserved_count <> 0",
      [tierIds],
    );
    if ((capacity.rows[0]?.count ?? 0) !== 0) fail("Quedó capacidad reservada del harness; se preservaron fixtures.");

    await client.query("begin");
    try {
      await client.query(
        `delete from commerce.launch_checkout_orders
          where commerce_order = any($1::text[]) and launch_id = any($2::uuid[]) and tier_id = any($3::uuid[])
            and status = 'creation_failed' and capacity_held = false and flow_order is null`,
        [ownedOrderIds, launchIds, tierIds],
      );
      await client.query("delete from public.launches where id = any($1::uuid[]) and slug = any($2::text[])", [
        launchIds, fixtures.map((fixture) => fixture.slug),
      ]);

      const leftover = await client.query<{ orders: number; launches: number }>(
        `select
           (select count(*)::int from commerce.launch_checkout_orders where commerce_order = any($1::text[])) as orders,
           (select count(*)::int from public.launches where id = any($2::uuid[])) as launches`,
        [orders, launchIds],
      );
      if (leftover.rows[0]?.orders !== 0 || leftover.rows[0]?.launches !== 0) {
        fail("Quedaron filas propias del harness tras la limpieza; no se borraron datos adicionales.");
      }
      await client.query("commit");
    } catch (error) {
      try { await client.query("rollback"); } catch { /* no tocar más filas si la limpieza no se confirma */ }
      throw error;
    }
  } finally {
    client.release();
  }
}

async function run(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    help();
    return;
  }
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const target = await verifyTemporaryTarget();
  const pool = new Pool({ connectionString: target.connectionString, max: 4, connectionTimeoutMillis: CONNECTION_TIMEOUT_MS });
  const runId = randomUUID().replaceAll("-", "");
  const appPrefix = `launch-checkout-harness-${runId}`;
  const fixtures: Array<{ launchId: string; tierId: string; slug: string; resource: string }> = [];
  const orders = [newOrder(), newOrder(), newOrder(), newOrder()];
  const checkedOut: PoolClient[] = [];
  const openTransactions: PoolClient[] = [];
  const concurrentCalls: Array<Promise<unknown>> = [];
  let secondClient: PoolClient | undefined;
  let failure: unknown;

  try {
    const first = await pool.connect();
    checkedOut.push(first);
    const second = await pool.connect();
    checkedOut.push(second);
    const monitor = await pool.connect();
    checkedOut.push(monitor);
    secondClient = second;
    const pids = await Promise.all([first, second].map(async (client) => {
      const result = await client.query<{ pid: number }>("select pg_catalog.pg_backend_pid() as pid");
      return result.rows[0]?.pid;
    }));
    if (!pids[0] || !pids[1] || pids[0] === pids[1]) fail("El pool no proporcionó dos sesiones PostgreSQL distintas.");
    await assertMigrationInstalled(monitor);

    const idempotencySlug = newSlug("e10-idem");
    const capacitySlug = newSlug("e10-capacity");
    const idempotencyFixtureIds = { launchId: randomUUID(), tierId: randomUUID() };
    const capacityFixtureIds = { launchId: randomUUID(), tierId: randomUUID() };
    const idempotencyResource = `ebook:concurrency-${randomUUID().replaceAll("-", "")}`;
    const capacityResource = `ebook:concurrency-${randomUUID().replaceAll("-", "")}`;
    // Track deterministic IDs before writes so cleanup can recover if a commit response is lost.
    const idempotencyFixtureRecord = { ...idempotencyFixtureIds, slug: idempotencySlug, resource: idempotencyResource };
    const capacityFixtureRecord = { ...capacityFixtureIds, slug: capacitySlug, resource: capacityResource };
    fixtures.push(idempotencyFixtureRecord, capacityFixtureRecord);
    const idempotencyFixture = await insertFixture(monitor, idempotencyFixtureIds.launchId, idempotencyFixtureIds.tierId, idempotencySlug, idempotencyResource, 2);
    Object.assign(idempotencyFixtureRecord, idempotencyFixture);
    const capacityFixture = await insertFixture(monitor, capacityFixtureIds.launchId, capacityFixtureIds.tierId, capacitySlug, capacityResource, 1);
    Object.assign(capacityFixtureRecord, capacityFixture);

    const idempotency = newKey();
    await first.query("begin");
    openTransactions.push(first);
    const initial = await callReservation(first, `${appPrefix}-idem-first`, orders[0], idempotency.hash, idempotencySlug);
    if (initial.commerce_order !== orders[0]) fail("La primera reserva no creó la orden de fixture esperada.");

    const idempotentRetry = callReservation(second, `${appPrefix}-idem-second`, orders[1], idempotency.hash, idempotencySlug)
      .then((value) => ({ ok: true as const, value }), (error: unknown) => ({ ok: false as const, error }));
    concurrentCalls.push(idempotentRetry);
    await waitUntilBlocked(monitor, `${appPrefix}-idem-second`);
    await first.query("commit");
    openTransactions.splice(openTransactions.indexOf(first), 1);
    const retryOutcome = await idempotentRetry;
    if (!retryOutcome.ok) throw retryOutcome.error;
    const retry = retryOutcome.value;
    if (retry.commerce_order !== orders[0]) fail("Dos sesiones con la misma idempotency key no devolvieron la misma orden.");

    const idempotencyRows = await monitor.query<{ count: number; reserved_count: number }>(
      `select count(*)::int as count, max(t.reserved_count)::int as reserved_count
         from commerce.launch_checkout_orders o
         join public.launch_price_tiers t on t.id = o.tier_id
        where o.idempotency_key_hash = $1`,
      [idempotency.hash],
    );
    if (idempotencyRows.rows[0]?.count !== 1 || idempotencyRows.rows[0]?.reserved_count !== 1) {
      fail("La idempotency key creó más de una orden o reservó más de un cupo.");
    }

    const capacityKeyA = newKey();
    const capacityKeyB = newKey();
    await first.query("begin");
    openTransactions.push(first);
    const capacityReservation = await callReservation(first, `${appPrefix}-capacity-first`, orders[2], capacityKeyA.hash, capacitySlug);
    if (capacityReservation.commerce_order !== orders[2]) fail("La primera reserva de capacidad no creó la orden esperada.");

    const soldOutAttempt = callReservation(second, `${appPrefix}-capacity-second`, orders[3], capacityKeyB.hash, capacitySlug)
      .then(() => ({ code: "unexpected_success", message: "" }))
      .catch((error: unknown) => ({
        code: typeof error === "object" && error && "code" in error ? String(error.code) : "",
        message: typeof error === "object" && error && "message" in error ? String(error.message) : "",
      }));
    concurrentCalls.push(soldOutAttempt);
    await waitUntilBlocked(monitor, `${appPrefix}-capacity-second`);
    await first.query("commit");
    openTransactions.splice(openTransactions.indexOf(first), 1);
    const soldOut = await soldOutAttempt;
    if (!soldOut.message.includes("launch_checkout_sold_out")) {
      fail("La segunda llave distinta no terminó en launch_checkout_sold_out al agotarse el cupo.");
    }

    const capacityRows = await monitor.query<{ count: number; reserved_count: number }>(
      `select count(*)::int as count, max(t.reserved_count)::int as reserved_count
         from commerce.launch_checkout_orders o
         join public.launch_price_tiers t on t.id = o.tier_id
        where o.launch_id = $1`,
      [capacityFixture.launchId],
    );
    if (capacityRows.rows[0]?.count !== 1 || capacityRows.rows[0]?.reserved_count !== 1) {
      fail("La reserva de capacidad no coincide con el límite configurado.");
    }

    console.log("PASS: dos sesiones PostgreSQL distintas ejecutaron contención real.");
    console.log("PASS: idempotencia simultánea devolvió una orden y una sola reserva.");
    console.log("PASS: la segunda clave recibió sold_out con capacidad uno.");
  } catch (error) {
    failure = error;
  } finally {
    for (const client of openTransactions) {
      try { await client.query("rollback"); } catch { /* se comprobará la limpieza antes de cerrar */ }
    }
    if (concurrentCalls.length) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const settled = await Promise.race([
        Promise.allSettled(concurrentCalls).then(() => true),
        new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(false), WAIT_TIMEOUT_MS); }),
      ]);
      if (timer) clearTimeout(timer);
      if (!settled && secondClient) {
        failure = new AggregateError([failure, new Error("La sesión bloqueada no terminó tras rollback; se cerrará su conexión.")].filter(Boolean));
        secondClient.release(new Error("Cierre seguro de sesión bloqueada del harness."));
        const index = checkedOut.indexOf(secondClient);
        if (index >= 0) checkedOut.splice(index, 1);
        await Promise.race([
          Promise.allSettled(concurrentCalls),
          new Promise((resolve) => setTimeout(resolve, CONNECTION_TIMEOUT_MS)),
        ]);
      }
    }
    try {
      await cleanupFixtures(pool, fixtures, orders);
    } catch (cleanupError) {
      failure = new AggregateError([failure, cleanupError].filter(Boolean), "Falló la prueba o quedó una limpieza incompleta.");
    }
    for (const client of checkedOut) client.release();
    await pool.end();
  }

  if (failure) {
    console.error(`FAIL: ${safeErrorMessage(failure)}`);
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  console.error(`FAIL: ${safeErrorMessage(error)}`);
  process.exitCode = 1;
});
