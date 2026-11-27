import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { EBOOK_LIBRARY_COOKIE,hashLibraryValue,isEbookLibraryEnabled } from "@/lib/ebook-library-config";
import { getSessionEmail,ownsResource } from "@/lib/ebook-library-repository";
import { downloadPrivateObject } from "@/lib/private-storage";
import { EBOOK_STORAGE_BUCKET,storageObjectName } from "@/lib/ebook-storage";
import type { EbookFormat } from "@/lib/ebook-storage";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const unavailable=()=>NextResponse.json({error:"Biblioteca no disponible."},{status:503,headers:{"Cache-Control":"no-store"}});
 if(!isEbookLibraryEnabled())return unavailable();
 const params=new URL(request.url).searchParams,resource=params.get("resource"),format=params.get("format");
 if(!resource||!/^ebook:[a-z0-9-]{1,160}$/.test(resource)||!(format==="movil"||format==="a4"))return NextResponse.json({error:"Recurso no disponible."},{status:404,headers:{"Cache-Control":"no-store"}});
 try{
  const token=(await cookies()).get(EBOOK_LIBRARY_COOKIE)?.value;if(!token)return NextResponse.json({error:"Acceso requerido."},{status:401});
  const email=await getSessionEmail(await hashLibraryValue(token));if(!email)return NextResponse.json({error:"Acceso requerido."},{status:401});
  if(!await ownsResource(email,resource))return NextResponse.json({error:"Recurso no disponible."},{status:404});
  const {data,error}=await downloadPrivateObject(EBOOK_STORAGE_BUCKET,storageObjectName(resource,format as EbookFormat));if(error||!data)return unavailable();
  return new Response(Buffer.from(await data.arrayBuffer()),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${resource.slice(6)}-${format}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return unavailable()}
}
