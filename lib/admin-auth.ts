import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, safeAdminDestination, validAdminSession } from "./admin-session";

export async function requireAdminSession(destination?: string) {
  if (!await hasAdminSession()) {
    redirect(destination ? `/admin/login?next=${encodeURIComponent(safeAdminDestination(destination))}` : "/admin/login");
  }
}

export async function hasAdminSession() {
  return validAdminSession((await cookies()).get(adminCookieName())?.value);
}
