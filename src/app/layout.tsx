import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRDO Chat App",
  description:
    "Secure internal communication platform with admin approval, real-time messaging, file sharing, and user management.",
  keywords: [
    "DRDO",
    "Chat App",
    "Secure Communication",
    "Next.js",
    "Prisma",
    "PostgreSQL",
    "Real Time Chat",
  ],
  authors: [
    {
      name: "Prince Kumar Gupta",
    },
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Secure Chat App",
    description:
      "Secure internal communication platform for authorized users.",
    url: "https://chat-app-beta-sable-17.vercel.app",
    siteName: "DRDO Chat App",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DRDO Chat App",
    description:
      "Secure internal communication platform for authorized users.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}