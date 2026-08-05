import { publishMicrodose } from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";

type PublishRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, context: PublishRouteContext) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const { slug } = await context.params;
  await publishMicrodose(slug);

  return Response.json({ ok: true });
}
