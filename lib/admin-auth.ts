import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, validAdminSession } from "./admin-session";

export async function requireAdminSession() {
  if (!await hasAdminSession()) redirect("/admin/login");
}

export async function hasAdminSession() {
  return validAdminSession((await cookies()).get(adminCookieName())?.value);
}
