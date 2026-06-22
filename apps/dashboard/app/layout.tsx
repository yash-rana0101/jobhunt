import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Job Hunting Agent",
  description: "Autonomous job search workspace",
};

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/contacts", label: "Contacts" },
  { href: "/applications", label: "Applications" },
  { href: "/analytics", label: "Analytics" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-semibold text-slate-950">
              Job Hunter Agent
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
