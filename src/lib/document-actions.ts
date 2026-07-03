"use server";

// Server actions de documentos: crear, renombrar, borrar.
// Siempre pasan por auth + reglas de plan de pago + ownership del documento.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing";
import { DEFAULT_EDITOR_CONTENT, getNextDocumentTitle, normalizeDocumentTitle } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { removeDocumentUploadDirectory } from "@/lib/uploads";

// Crea documento nuevo para el usuario actual y manda al editor.
export async function createDocumentAction(formData?: FormData) {
  const user = await requireUser();

  // Gating de negocio: sin plan activo, a upgrade.
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  // Leemos titulos existentes para sugerir el siguiente DocumentN.
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

  // Guardamos contenido minimo para que TipTap abra con estructura valida.
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

// Renombra un documento del usuario (si existe y le pertenece).
export async function renameDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  const documentId = String(formData.get("documentId") || "");

  // Si viene mal el form, salimos en silencio.
  if (!documentId) {
    return;
  }

  // Defensa de ownership: buscamos por id + userId.
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

  // Si no cambia nada, no hacemos update inutil.
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

// Borra documento del usuario y limpia carpeta de uploads asociada.
export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

  const documentId = String(formData.get("documentId") || "");

  if (!documentId) {
    return;
  }

  // deleteMany evita error si no existe o no pertenece al user.
  const result = await prisma.document.deleteMany({
    where: {
      id: documentId,
      userId: user.id
    }
  });

  if (result.count > 0) {
    // Limpiamos archivos fisicos solo si realmente se borro en DB.
    await removeDocumentUploadDirectory(user.id, documentId);
  }

  revalidatePath("/app/dashboard");
}
