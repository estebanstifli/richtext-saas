import { NextResponse } from "next/server";

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

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    if (!hasPaidAccess(user.subscription)) {
      throw new ForbiddenError(messages.errors.paidAccessRequired);
    }

    const { id } = await context.params;
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
      formData = await request.formData();
    } catch {
      throw new ValidationError();
    }

    const file = formData.get("image");

    if (!isUploadFile(file)) {
      throw new ValidationError(messages.errors.invalidImage);
    }

    const storedImage = await storeDocumentImage({
      documentId: document.id,
      file,
      userId: user.id
    });
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
