import { NextResponse } from "next/server";
import { deliverWorkshopOrders } from "@/lib/workshop-delivery";
export const dynamic="force-dynamic";
const authorized=(request:Request)=>Boolean(process.env.CRON_SECRET)&&request.headers.get("authorization")===`Bearer ${process.env.CRON_SECRET}`;
export async function GET(request:Request){if(!authorized(request))return new Response("Unauthorized",{status:401});const welcome=await deliverWorkshopOrders("welcome"),ebooks=await deliverWorkshopOrders("ebooks");return NextResponse.json({ok:true,welcome:welcome.sentCount,ebooks:ebooks.sentCount})}
