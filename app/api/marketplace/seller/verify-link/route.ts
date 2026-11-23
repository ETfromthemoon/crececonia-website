import { randomBytes } from "node:crypto";

// Standalone document: the access fragment must be removed before the site's
// analytics provider or any third-party script has a chance to observe it.
export async function GET() {
  const nonce = randomBytes(16).toString("base64");
  const html = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>Acceso de autor · CrececonIA</title></head><body><main style="max-width:32rem;margin:6rem auto;font:16px system-ui;padding:1rem"><h1>Acceso de autor</h1><p id="status" role="status">Verificando tu enlace…</p><a href="/ebooks/vender">Volver al espacio de autores</a></main><script nonce="${nonce}">
const token = new URLSearchParams(location.hash.slice(1)).get('token');
history.replaceState(null, '', '/api/marketplace/seller/verify-link');
if (!token) document.getElementById('status').textContent = 'El enlace no contiene un código válido.';
else fetch('/api/marketplace/seller/verify', {method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body:JSON.stringify({token})})
  .then(response => { if (!response.ok) throw new Error(); location.replace('/ebooks/vender'); })
  .catch(() => { document.getElementById('status').textContent = 'El enlace venció o ya se utilizó. Solicita uno nuevo desde el espacio de autores.'; });
</script></body></html>`;
  return new Response(html, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  } });
}
