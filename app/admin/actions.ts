"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { microdoseInputFromForm, optionalStringField, stringField } from "@/lib/admin/forms";
import {
  archiveMicrodose,
  createMicrodose,
  publishMicrodose,
  unpublishMicrodose,
  updateDraftMicrodose,
  upsertPerson,
} from "@/lib/admin/microdose-repository";

export async function createMicrodoseAction(formData: FormData) {
  await requireAdmin();
  const input = microdoseInputFromForm(formData);
  const slug = await createMicrodose(input);

  revalidatePath("/microdoses");
  redirect(`/admin/microdoses/${slug}`);
}

export async function updateMicrodoseAction(
  currentSlug: string,
  formData: FormData,
) {
  await requireAdmin();
  const input = microdoseInputFromForm(formData);
  await updateDraftMicrodose(currentSlug, input);

  revalidatePath("/microdoses");
  revalidatePath(`/microdoses/${currentSlug}`);
  redirect(`/admin/microdoses/${input.slug}`);
}

export async function publishMicrodoseAction(slug: string) {
  await requireAdmin();
  await publishMicrodose(slug);
  revalidatePath("/microdoses");
  revalidatePath(`/microdoses/${slug}`);
  redirect(`/admin/microdoses/${slug}`);
}

export async function unpublishMicrodoseAction(slug: string) {
  await requireAdmin();
  await unpublishMicrodose(slug);
  revalidatePath("/microdoses");
  revalidatePath(`/microdoses/${slug}`);
  redirect(`/admin/microdoses/${slug}`);
}

export async function archiveMicrodoseAction(slug: string) {
  await requireAdmin();
  await archiveMicrodose(slug);
  revalidatePath("/microdoses");
  revalidatePath(`/microdoses/${slug}`);
  redirect("/admin");
}

export async function upsertPersonAction(formData: FormData) {
  await requireAdmin();
  await upsertPerson({
    id: optionalStringField(formData, "id"),
    name: stringField(formData, "name"),
    bio: stringField(formData, "bio"),
  });
  redirect("/admin/people");
}
