import { requireAdmin } from "@/lib/auth";

export async function requireAdminApi() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
