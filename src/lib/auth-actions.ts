"use server";

// Aqui viven las server actions de auth (registro/login).
// Este fichero decide validaciones de formulario, errores y redirecciones finales.

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { messages } from "@/messages/en";

export type AuthActionState = {
  error?: string;
};

// Regex basica para no aceptar emails claramente invalidos.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lee y normaliza lo que llega del form (FormData del navegador).
function readCredentials(formData: FormData) {
  // Email en minusculas para evitar usuarios duplicados por mayusculas.
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const plan = String(formData.get("plan") || "");

  return { email, password, plan };
}

// Decide a donde mandar al usuario despues de login/registro.
function selectedPlanRedirect(plan: string) {
  if (plan === "monthly" || plan === "annual" || plan === "lifetime") {
    return `/upgrade?plan=${plan}`;
  }

  return "/app/dashboard";
}

// Registro: valida datos, crea usuario en Prisma, crea sesion y redirige.
export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const { email, password, plan } = readCredentials(formData);

  // Si falla email, devolvemos error legible al form.
  if (!emailPattern.test(email)) {
    return { error: messages.auth.invalidEmail };
  }

  // Regla minima de password para no guardar passwords flojas.
  if (password.length < 8) {
    return { error: messages.auth.weakPassword };
  }

  const redirectTo = selectedPlanRedirect(plan);

  try {
    // Crea usuario + suscripcion FREE inicial en la misma operacion.
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

    // Login automatico justo despues de registrarse.
    await createSession(user.id);
  } catch (error) {
    // P2002 = violacion de unique (email repetido).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: messages.auth.emailExists };
    }

    logger.error("Registration failed", error);
    return { error: messages.auth.genericFailure };
  }

  redirect(redirectTo);
}

// Login: comprueba email/password contra Prisma y abre sesion.
// Si todo cuadra, redirige al dashboard (o upgrade con plan preseleccionado).
export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const { email, password, plan } = readCredentials(formData);

  // Filtro rapido antes de ir a base de datos.
  if (!emailPattern.test(email) || password.length < 1) {
    return { error: messages.auth.invalidCredentials };
  }

  // Busca usuario por email (normalizado arriba).
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return { error: messages.auth.invalidCredentials };
  }

  // Compara password en claro con hash guardado.
  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return { error: messages.auth.invalidCredentials };
  }

  // Si credenciales ok, crea cookie de sesion y a volar.
  await createSession(user.id);
  redirect(selectedPlanRedirect(plan));
}
