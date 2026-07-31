import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HomePulse Dashboard",
  description: "Server & Network Telemetry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={cn(inter.className, "overflow-hidden")}>
        <ScrollArea className="h-[100dvh] w-full">
          {children}
        </ScrollArea>
      </body>
    </html>
  );
}
