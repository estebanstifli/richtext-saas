"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing";
import { DEFAULT_EDITOR_CONTENT, getNextDocumentTitle, normalizeDocumentTitle } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { removeDocumentUploadDirectory } from "@/lib/uploads";

export async function createDocumentAction(formData?: FormData) {
  const user = await requireUser();
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  const existingDocuments = await prisma.document.findMany({
    where: {
      userId: user.id
    },
    select: {
      title: true
    }
  });
  const fallbackTitle = getNextDocumentTitle(existingDocuments);
  const title = normalizeDocumentTitle(formData?.get("title") ?? null, fallbackTitle);
  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title,
      content: JSON.stringify(DEFAULT_EDITOR_CONTENT)
    }
  });

  revalidatePath("/app/dashboard");
  redirect(`/documents/${document.id}`);
}

export async function renameDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  const documentId = String(formData.get("documentId") || "");

  if (!documentId) {
    return;
  }

  const existingDocument = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId: user.id
    }
  });

  if (!existingDocument) {
    return;
  }

  const title = normalizeDocumentTitle(formData.get("title"), existingDocument.title);

  if (title === existingDocument.title) {
    return;
  }

  await prisma.document.update({
    where: {
      id: existingDocument.id
    },
    data: {
      title
    }
  });

  revalidatePath("/app/dashboard");
  revalidatePath(`/documents/${documentId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  const documentId = String(formData.get("documentId") || "");

  if (!documentId) {
    return;
  }

  const result = await prisma.document.deleteMany({
    where: {
      id: documentId,
      userId: user.id
    }
  });

  if (result.count > 0) {
    await removeDocumentUploadDirectory(user.id, documentId);
  }

  revalidatePath("/app/dashboard");
}
