import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pedido de Laranjas 🍊",
  description: "Faça seu pedido de sacos de laranja de forma rápida e fácil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
