import { NextResponse } from "next/server";
import { deliverWorkshopOrders } from "@/lib/workshop-delivery";
import { getWorkshopSettings } from "@/lib/workshop-settings";
export const dynamic="force-dynamic";
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return new Response("Unauthorized",{status:401});if(!(await getWorkshopSettings()).sessionUrl)return NextResponse.json({ok:false,reason:"WORKSHOP_SESSION_URL pendiente"},{status:409});const result=await deliverWorkshopOrders("session-1h");return NextResponse.json({ok:true,sentCount:result.sentCount})}
