"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { messages } from "@/messages/en";

export type AuthActionState = {
  error?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const plan = String(formData.get("plan") || "");

  return { email, password, plan };
}

function selectedPlanRedirect(plan: string) {
  if (plan === "monthly" || plan === "annual" || plan === "lifetime") {
    return `/upgrade?plan=${plan}`;
  }

  return "/app/dashboard";
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const { email, password, plan } = readCredentials(formData);

  if (!emailPattern.test(email)) {
    return { error: messages.auth.invalidEmail };
  }

  if (password.length < 8) {
    return { error: messages.auth.weakPassword };
  }

  const redirectTo = selectedPlanRedirect(plan);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        subscription: {
          create: {
            status: "FREE",
            plan: "FREE"
          }
        }
      }
    });

    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: messages.auth.emailExists };
    }

    logger.error("Registration failed", error);
    return { error: messages.auth.genericFailure };
  }

  redirect(redirectTo);
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const { email, password, plan } = readCredentials(formData);

  if (!emailPattern.test(email) || password.length < 1) {
    return { error: messages.auth.invalidCredentials };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return { error: messages.auth.invalidCredentials };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return { error: messages.auth.invalidCredentials };
  }

  await createSession(user.id);
  redirect(selectedPlanRedirect(plan));
}
