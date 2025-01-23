import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import DashboardWrapper from "./dashboardWrapper";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] }); // Customize as needed

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'This is my app description',
};

export default function RootLayout({
   children 
  }: Readonly<{ 
    children: React.ReactNode;
   }>) {
  return (
   
    <html lang="en">
      <body className={inter.className}>
     
          <main>
          <DashboardWrapper>{children}</DashboardWrapper>
          </main>
    
        </body>
    </html>
   
  );
}
