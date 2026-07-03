import { NextResponse } from "next/server";

// API para guardar contenido del editor (PATCH del documento).
// Aqui hacemos auth + paid access + ownership antes de tocar DB.

import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing";
import { serializeEditorContent } from "@/lib/documents";
import { ForbiddenError, NotFoundError, ValidationError, handleRouteError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { messages } from "@/messages/en";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/documents/:id
// Guarda JSON TipTap serializado y devuelve updatedAt.
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Sin plan activo, no se puede editar/guardar.
    if (!hasPaidAccess(user.subscription)) {
      throw new ForbiddenError(messages.errors.paidAccessRequired);
    }

    const { id } = await context.params;

    // Ownership check: este endpoint nunca debe permitir tocar docs ajenos.
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!document) {
      throw new NotFoundError();
    }

    let body: unknown;

    try {
      // Leemos body JSON enviado por el editor (client component).
      body = await request.json();
    } catch {
      throw new ValidationError();
    }

    // serializeEditorContent normaliza estructura y evita payloads raros en DB.
    const content = (body as { content?: unknown }).content;
    const updatedDocument = await prisma.document.update({
      where: {
        id: document.id
      },
      data: {
        content: serializeEditorContent(content)
      }
    });

    return NextResponse.json({
      ok: true,
      updatedAt: updatedDocument.updatedAt
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
