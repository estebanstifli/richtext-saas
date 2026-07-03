import "server-only";

// Utilidades base de autenticacion/sesion del server.
// Aqui se cocina todo lo importante: hash de password, cookie de sesion y lectura del usuario actual.

import type { Subscription, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";

import { UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = User & {
  subscription: Subscription | null;
};

// Duracion de sesion (en dias) para el cookie login.
const SESSION_TTL_DAYS = 30;

// Nombre del cookie de sesion (configurable por env).
function sessionCookieName() {
  return process.env.AUTH_COOKIE_NAME || "rtext_session";
}

// Hash del token de sesion para no guardar el token en claro en DB.
function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Fecha de expiracion del cookie y de la sesion en DB.
function sessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

// Hashea el password del usuario (bcrypt).
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Compara password en claro con hash guardado.
export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

// Crea sesion: genera token, guarda hash+expiracion en DB y setea cookie httpOnly.
export async function createSession(userId: string) {
  // Token random fuerte para sesion.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiryDate();

  // Se guarda hash del token, no el token real.
  await prisma.user.update({
    where: { id: userId },
    data: {
      sessionTokenHash: hashSessionToken(token),
      sessionExpiresAt: expiresAt
    }
  });

  const cookieStore = await cookies();
  // Cookie de sesion segura para que JS del navegador no pueda leerlo.
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

// Cierra sesion: limpia DB y borra cookie local.
export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  // Si hay token, buscamos por hash y dejamos sesion en null.
  if (token) {
    await prisma.user.updateMany({
      where: { sessionTokenHash: hashSessionToken(token) },
      data: {
        sessionTokenHash: null,
        sessionExpiresAt: null
      }
    });
  }

  // Siempre borramos cookie por si quedo algo en cliente.
  cookieStore.delete(sessionCookieName());
}

// Devuelve usuario autenticado actual o null si no hay sesion valida.
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  // Sin cookie, no hay nada que resolver.
  if (!token) {
    return null;
  }

  // Valida hash + expiracion antes de devolver usuario.
  return prisma.user.findFirst({
    where: {
      sessionTokenHash: hashSessionToken(token),
      sessionExpiresAt: {
        gt: new Date()
      }
    },
    include: {
      subscription: true
    }
  });
}

// Guard de pagina: si no hay usuario, te manda al login.
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

// Guard para API: si no hay usuario, lanza 401 (en vez de redirect).
export async function getAuthenticatedUserOrThrow() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
