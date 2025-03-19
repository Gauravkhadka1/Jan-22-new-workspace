import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./layoutWrapper"; // Your existing wrapper component
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workspace_Webtech",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        {/* suppressHydrationWarning is added to avoid warnings during theme changes */}
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Wrap your application with ThemeProvider */}
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}