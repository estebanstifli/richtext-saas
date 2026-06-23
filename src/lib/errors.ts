import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { messages } from "@/messages/en";

export class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = messages.errors.unauthorized) {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = messages.errors.forbidden) {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = messages.errors.notFound) {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string = messages.errors.invalidInput) {
    super("VALIDATION_ERROR", message, 422);
  }
}

export class BillingError extends ApplicationError {
  constructor(message: string, statusCode = 400) {
    super("BILLING_ERROR", message, statusCode);
  }
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApplicationError) {
    logger.info("Handled application error", {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message
    });

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.statusCode }
    );
  }

  logger.error("Unhandled route error", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: messages.errors.internal
      }
    },
    { status: 500 }
  );
}
