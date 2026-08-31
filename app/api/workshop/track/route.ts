import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";

const allowed=new Set(["page_view","checkout_started"]);
const clean=(value:unknown,max=160)=>typeof value==="string"?value.trim().slice(0,max)||null:null;
export async function POST(request:Request){const body=await request.json().catch(()=>null);const event=clean(body?.event,30),sessionId=clean(body?.sessionId,64);if(!event||!allowed.has(event)||!sessionId||!/^[a-zA-Z0-9-]{16,64}$/.test(sessionId))return NextResponse.json({error:"Evento inválido."},{status:400});const{error}=await getSupabaseAdmin().rpc("record_workshop_event",{p_product_key:WORKSHOP_PRODUCT_KEY,p_event_name:event,p_session_id:sessionId,p_source:clean(body?.source),p_medium:clean(body?.medium),p_campaign:clean(body?.campaign),p_referrer:clean(body?.referrer,500)});return error?NextResponse.json({error:"No se pudo registrar."},{status:503}):NextResponse.json({ok:true})}
