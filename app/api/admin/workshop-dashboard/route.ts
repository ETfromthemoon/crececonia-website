import { isAdminRequest } from "@/lib/admin-session";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";
export const dynamic="force-dynamic";
const authorized = isAdminRequest;
export async function GET(request:Request){if(!authorized(request))return NextResponse.json({error:"No autorizado."},{status:401});const{data,error}=await getSupabaseAdmin().rpc("workshop_admin_dashboard",{p_product_key:WORKSHOP_PRODUCT_KEY});if(error)return NextResponse.json({error:error.message},{status:503});return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}})}
