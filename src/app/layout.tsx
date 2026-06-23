import type { Metadata } from "next";

import "@/app/globals.css";
import { messages } from "@/messages/en";

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
