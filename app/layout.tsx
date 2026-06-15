import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.coolmolecules.media"),
  title: "Cool Molecules Media",
  description: "An independent storytelling collective.",
  openGraph: {
    title: "Cool Molecules Media",
    description: "An independent storytelling collective.",
    url: "https://www.coolmolecules.media",
    siteName: "Cool Molecules Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cool Molecules Media",
    description: "An independent storytelling collective.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
