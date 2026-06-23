import { NextResponse } from "next/server";

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

export async function PATCH(request: Request, context: RouteContext) {
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
      }
    });

    if (!document) {
      throw new NotFoundError();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new ValidationError();
    }

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
