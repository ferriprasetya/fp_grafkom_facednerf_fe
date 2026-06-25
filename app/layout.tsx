import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FaceDNeRF vs TripoSR",
  description:
    "Compare FaceDNeRF and TripoSR meshes, then run TripoSR inference on Modal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='h-full dark antialiased'>
      <body className='min-h-full flex flex-col'>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

