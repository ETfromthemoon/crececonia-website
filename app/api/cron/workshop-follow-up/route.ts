import { NextResponse } from "next/server";
import { deliverWorkshopOrders } from "@/lib/workshop-delivery";
import { WORKSHOP_END } from "@/lib/workshop-product";
export const dynamic="force-dynamic";
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return new Response("Unauthorized",{status:401});if(Date.now()<Date.parse(WORKSHOP_END)+8*60*60*1000)return NextResponse.json({ok:true,skipped:"workshop_not_finished"});const result=await deliverWorkshopOrders("follow-up");return NextResponse.json({ok:true,sentCount:result.sentCount})}
