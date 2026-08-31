import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";
export const dynamic="force-dynamic";
const authorized=(request:Request)=>Boolean(process.env.ADMIN_SECRET)&&(request.headers.get("x-admin-key")??new URL(request.url).searchParams.get("key"))===process.env.ADMIN_SECRET;
export async function GET(request:Request){if(!authorized(request))return NextResponse.json({error:"No autorizado."},{status:401});const{data,error}=await getSupabaseAdmin().rpc("workshop_admin_dashboard",{p_product_key:WORKSHOP_PRODUCT_KEY});if(error)return NextResponse.json({error:error.message},{status:503});return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}})}
