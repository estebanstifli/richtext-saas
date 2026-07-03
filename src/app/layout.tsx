import type { Metadata } from "next";

import "@/app/globals.css";
import { messages } from "@/messages/en";

// Metadata global usada por Next para title/description base.
export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description
};

// Layout raiz: html/body compartidos por toda la app.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
