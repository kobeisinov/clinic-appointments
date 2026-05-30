import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Запись к врачу",
  description: "Онлайн-запись на приём в клинику",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
