import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { EBOOK_LIBRARY_COOKIE,hashLibraryValue,isEbookLibraryEnabled } from "@/lib/ebook-library-config";
import { revokeSession } from "@/lib/ebook-library-repository";
import { SITE_URL } from "@/lib/seo";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(SITE_URL).origin)return NextResponse.json({error:"Solicitud no válida."},{status:403});
 const store=await cookies(), token=store.get(EBOOK_LIBRARY_COOKIE)?.value;
 if(token&&isEbookLibraryEnabled())try{await revokeSession(await hashLibraryValue(token))}catch{return NextResponse.json({error:"No pudimos cerrar la sesión."},{status:503,headers:{"Cache-Control":"no-store"}})}
 const response=NextResponse.redirect(new URL("/biblioteca/acceso",SITE_URL),303);
 response.cookies.set(EBOOK_LIBRARY_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});return response;
}
