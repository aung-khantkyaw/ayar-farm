import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans, Playfair_Display, Noto_Serif, Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/providers/auth-provider";
import { SocketProvider } from "@/providers/socket-provider";

const notoSerif = Noto_Serif({subsets:['latin'],variable:'--font-serif'});

const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AyarFarm Link - Agricultural Knowledge Sharing Platform",
  description: "Your trusted agricultural knowledge sharing platform. Connect with farmers, access expert knowledge, get real-time market prices, and receive AI-powered farming assistance with the AyarFarm Link mobile app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("antialiased", geistSans.variable, geistMono.variable, notoSans.variable, "font-serif", notoSerif.variable, publicSansHeading.variable)}
    >
      <body className="flex flex-col">
        <TooltipProvider>
          <AuthProvider>
            <SocketProvider>
              <LanguageProvider>
                {children}
                <Toaster
                  position="bottom-right"
                  richColors
                  closeButton
                  expand
                  visibleToasts={3}
                  toastOptions={{
                    duration: 5000,
                  }}
                />
              </LanguageProvider>
            </SocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
