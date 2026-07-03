import { NextResponse } from "next/server";

// API de subida de imagenes del editor.
// Valida auth/plan/ownership y luego guarda archivo + metadata.

import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing";
import { ForbiddenError, NotFoundError, ValidationError, handleRouteError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isUploadFile, storeDocumentImage } from "@/lib/uploads";
import { messages } from "@/messages/en";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/documents/:id/assets
// Devuelve asset con id/url/alt para insertarlo en TipTap.
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Igual que en guardado: sin pago activo, no hay uploads.
    if (!hasPaidAccess(user.subscription)) {
      throw new ForbiddenError(messages.errors.paidAccessRequired);
    }

    const { id } = await context.params;

    // Misma regla de ownership que el guardado de contenido.
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id
      },
      select: {
        id: true
      }
    });

    if (!document) {
      throw new NotFoundError();
    }

    let formData: FormData;

    try {
      // FormData porque llega archivo binario.
      formData = await request.formData();
    } catch {
      throw new ValidationError();
    }

    const file = formData.get("image");

    // Check de tipo basico (que venga un File real y no texto/valor vacio).
    if (!isUploadFile(file)) {
      throw new ValidationError(messages.errors.invalidImage);
    }

    // storeDocumentImage aplica validaciones fuertes y deja URL publica lista para editor.
    const storedImage = await storeDocumentImage({
      documentId: document.id,
      file,
      userId: user.id
    });

    // Guardamos metadata en DB para rastrear assets por documento/usuario.
    const asset = await prisma.documentAsset.create({
      data: {
        documentId: document.id,
        userId: user.id,
        ...storedImage
      }
    });

    return NextResponse.json({
      asset: {
        id: asset.id,
        alt: asset.fileName,
        url: asset.url
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
