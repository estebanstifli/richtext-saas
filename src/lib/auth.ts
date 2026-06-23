import "server-only";

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

const SESSION_TTL_DAYS = 30;

function sessionCookieName() {
  return process.env.AUTH_COOKIE_NAME || "rtext_session";
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiryDate();

  await prisma.user.update({
    where: { id: userId },
    data: {
      sessionTokenHash: hashSessionToken(token),
      sessionExpiresAt: expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  if (token) {
    await prisma.user.updateMany({
      where: { sessionTokenHash: hashSessionToken(token) },
      data: {
        sessionTokenHash: null,
        sessionExpiresAt: null
      }
    });
  }

  cookieStore.delete(sessionCookieName());
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  if (!token) {
    return null;
  }

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

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getAuthenticatedUserOrThrow() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
