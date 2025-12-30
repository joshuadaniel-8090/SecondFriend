import type { Metadata } from "next";
import { FirebaseClientProvider } from "@/lib/firebase/client-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: "Second Friend",
  description: "A safe space for students to connect with counselors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
              {children}
              <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
