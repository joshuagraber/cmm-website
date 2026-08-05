import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db/client";

export async function requireAdminPage(callbackUrl = "/admin") {
  const session = await getAdminSession();

  if (!session?.user?.email) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export function databaseReady() {
  return hasDatabase();
}
