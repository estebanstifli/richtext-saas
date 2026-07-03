import { NextResponse } from "next/server";

// Endpoint de logout.
// Limpia sesion en server y manda al usuario a la home.

import { clearSession } from "@/lib/auth";

// POST /api/auth/logout
export async function POST() {
  // Quita hash/expiracion de sesion y borra cookie.
  await clearSession();

  // 303 para navegar con GET a '/'.
  return new NextResponse(null, {
    headers: {
      Location: "/"
    },
    status: 303
  });
}
