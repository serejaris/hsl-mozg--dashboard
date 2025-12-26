import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "HSL Bot Dashboard",
  description: "Dashboard for HashSlash School Telegram Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
