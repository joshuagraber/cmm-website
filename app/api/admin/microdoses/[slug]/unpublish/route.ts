import { unpublishMicrodose } from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";

type UnpublishRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, context: UnpublishRouteContext) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const { slug } = await context.params;
  await unpublishMicrodose(slug);

  return Response.json({ ok: true });
}
