import { NextResponse } from "next/server";

// Catalogo de errores de negocio + helper para responder en APIs.
// Objetivo: que todas las rutas devuelvan formato consistente y facil de depurar.

import { logger } from "@/lib/logger";
import { messages } from "@/messages/en";

// Error base de app con code + status HTTP.
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

// 401: usuario no autenticado.
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = messages.errors.unauthorized) {
    super("UNAUTHORIZED", message, 401);
  }
}

// 403: autenticado pero sin permiso.
export class ForbiddenError extends ApplicationError {
  constructor(message: string = messages.errors.forbidden) {
    super("FORBIDDEN", message, 403);
  }
}

// 404: recurso no encontrado.
export class NotFoundError extends ApplicationError {
  constructor(message: string = messages.errors.notFound) {
    super("NOT_FOUND", message, 404);
  }
}

// 422: datos enviados invalidos.
export class ValidationError extends ApplicationError {
  constructor(message: string = messages.errors.invalidInput) {
    super("VALIDATION_ERROR", message, 422);
  }
}

// Error de billing con codigo semantico propio.
export class BillingError extends ApplicationError {
  constructor(message: string, statusCode = 400) {
    super("BILLING_ERROR", message, statusCode);
  }
}

// Traductor de errores -> JSON HTTP uniforme para route handlers.
export function handleRouteError(error: unknown) {
  // Errores controlados de negocio.
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

  // Error inesperado: lo logueamos y devolvemos 500 generico.
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
