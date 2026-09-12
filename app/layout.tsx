import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "PyDebug | Write. Debug. Understand.",
  description:
    "A modern Python debugging platform for students and programmers to find, understand, and fix Python code errors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <UserProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
