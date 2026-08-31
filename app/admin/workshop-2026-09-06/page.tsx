import { notFound } from "next/navigation";
import WorkshopDashboardLive from "@/components/admin/WorkshopDashboardLive";
import WorkshopSettingsForm from "@/components/admin/WorkshopSettingsForm";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY, WORKSHOP_SESSION_LABEL, WORKSHOP_TITLE } from "@/lib/workshop-product";
import { getWorkshopSettings } from "@/lib/workshop-settings";

export const dynamic="force-dynamic";

const emptyDashboard={generatedAt:new Date().toISOString(),metrics:{paid:0,revenue:0,salesToday:0,revenueToday:0,averageTicket:0,paymentConversion:0,landingViews:0,checkoutStarts:0,checkoutRate:0,visitorConversion:0,salesLastHour:0,activeReservations:0,deliveryRate:0,bounceRate:0,deliveryFailures:0},orders:[],deliveries:[],channels:[]};

export default async function WorkshopAdminPage({searchParams}:{searchParams:Promise<{key?:string}>}){
  const{key}=await searchParams;if(!process.env.ADMIN_SECRET||key!==process.env.ADMIN_SECRET)notFound();
  const[settings,dashboardResult]=await Promise.all([getWorkshopSettings(),getSupabaseAdmin().rpc("workshop_admin_dashboard",{p_product_key:WORKSHOP_PRODUCT_KEY})]);
  const dashboard=dashboardResult.error?emptyDashboard:dashboardResult.data;
  return <main className="workshop-admin"><header><div><p>Admin · workshop en vivo</p><h1>{WORKSHOP_TITLE}</h1><span>{WORKSHOP_SESSION_LABEL}</span></div><a href="/workshop-en-vivo-2026-09-06" target="_blank">Ver página ↗</a></header><WorkshopDashboardLive adminKey={key} initial={dashboard}/><section className="workshop-admin-operation"><div><p>Operación de la sala</p><h2>Publica cada recurso cuando esté listo.</h2><span>Meet puede configurarse antes. La grabación, SKOOL y el ZIP aparecen en la sala apenas guardas sus datos.</span></div><WorkshopSettingsForm adminKey={key} initial={settings}/></section></main>;
}
