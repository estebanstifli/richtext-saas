"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { DEFAULT_EDITOR_CONTENT, normalizeDocumentTitle } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export async function createDocumentAction() {
  const user = await requireUser();
  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title: normalizeDocumentTitle(null),
      content: JSON.stringify(DEFAULT_EDITOR_CONTENT)
    }
  });

  revalidatePath("/app/dashboard");
  redirect(`/documents/${document.id}`);
}

export async function renameDocumentAction(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") || "");

  if (!documentId) {
    return;
  }

  await prisma.document.updateMany({
    where: {
      id: documentId,
      userId: user.id
    },
    data: {
      title: normalizeDocumentTitle(formData.get("title"))
    }
  });

  revalidatePath("/app/dashboard");
  revalidatePath(`/documents/${documentId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") || "");

  if (!documentId) {
    return;
  }

  await prisma.document.deleteMany({
    where: {
      id: documentId,
      userId: user.id
    }
  });

  revalidatePath("/app/dashboard");
}
