import { NextResponse } from "next/server";
import { consumeChallenge } from "@/lib/ebook-library-repository";
import { createOpaqueToken, hashLibraryValue, isEbookLibraryEnabled, EBOOK_LIBRARY_COOKIE, EBOOK_LIBRARY_SESSION_TTL_SECONDS } from "@/lib/ebook-library-config";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!isEbookLibraryEnabled()) return NextResponse.json({ error: "Biblioteca no disponible." }, { status: 503, headers: {"Cache-Control":"no-store"} });
  if (request.headers.get("origin") !== new URL(SITE_URL).origin) return NextResponse.json({error:"Solicitud no válida."},{status:403});
  let token: unknown;
  try { const body:unknown=await request.json(); token=body&&typeof body==="object"?(body as Record<string,unknown>).token:null; } catch { return NextResponse.json({error:"Enlace no válido o vencido."},{status:400}); }
  if(typeof token!=="string"||token.length>100) return NextResponse.json({error:"Enlace no válido o vencido."},{status:400});
  const session=createOpaqueToken();
  try {
    if(!await consumeChallenge(await hashLibraryValue(token),await hashLibraryValue(session))) return NextResponse.json({error:"Enlace no válido o vencido."},{status:400,headers:{"Cache-Control":"no-store"}});
    const response=NextResponse.json({ok:true,redirect:"/biblioteca"},{headers:{"Cache-Control":"no-store"}});
    response.cookies.set(EBOOK_LIBRARY_COOKIE,session,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:EBOOK_LIBRARY_SESSION_TTL_SECONDS});
    return response;
  } catch { return NextResponse.json({error:"No pudimos validar el enlace."},{status:503,headers:{"Cache-Control":"no-store"}}); }
}
