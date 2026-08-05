import { revalidatePath } from "next/cache";
import { microdoseInputFromForm } from "@/lib/admin/forms";
import { updateDraftMicrodose } from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";

export const runtime = "nodejs";

type DraftRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PATCH(request: Request, context: DraftRouteContext) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const { slug } = await context.params;
    const formData = formDataFromPayload(await request.json());
    const input = microdoseInputFromForm(formData);

    await updateDraftMicrodose(slug, input);

    revalidatePath("/microdoses");
    revalidatePath(`/microdoses/${slug}`);
    revalidatePath(`/microdoses/${input.slug}`);
    revalidatePath(`/admin/microdoses/${slug}`);
    revalidatePath(`/admin/microdoses/${input.slug}`);

    return Response.json({ ok: true, slug: input.slug });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Draft autosave failed.",
      400,
    );
  }
}

function formDataFromPayload(payload: unknown) {
  const formData = new FormData();

  if (typeof payload !== "object" || payload === null) {
    return formData;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          formData.append(key, item);
        }
      }
    } else if (typeof value === "string") {
      formData.set(key, value);
    }
  }

  return formData;
}
