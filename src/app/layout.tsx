import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";
import { getUncategorizedCount } from "@/app/actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description: "Modern financial dashboard with dark mode and analytics",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let uncategorizedCount = 0;
  try {
    uncategorizedCount = await getUncategorizedCount();
  } catch (err) {
    console.error("Failed to fetch uncategorized count for sidebar", err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <div className={styles.appContainer}>
          <Suspense fallback={<div className={styles.sidebarPlaceholder}></div>}>
            <Sidebar uncompleteCount={uncategorizedCount} />
          </Suspense>
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
