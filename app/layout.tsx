import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Cities & Countries",
  description: "Fetch, store, and export countries and cities.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background antialiased"
        )}
      >
        <main className="container mx-auto max-w-2xl p-6">{children}</main>
      </body>
    </html>
  );
}
