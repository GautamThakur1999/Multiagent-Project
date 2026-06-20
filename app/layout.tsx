import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/components/PlanProvider";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Travel Planner",
  description:
    "Tell us your trip in a sentence. Get a plan you can actually follow — on budget, on time, on taste.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        {/* Material Symbols Outlined — icon set referenced by the design system.
            Loaded as a global stylesheet link (not next/font) because it is an
            icon font used across all routes. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-on-background antialiased">
        <PlanProvider>
          <a
            href="#main-content"
            className="skip-link rounded-full bg-primary px-4 py-2 text-label-md font-semibold text-on-primary"
          >
            Skip to content
          </a>
          <TopNav />
          <div id="main-content" className="flex flex-grow flex-col">
            {children}
          </div>
          <Footer />
        </PlanProvider>
      </body>
    </html>
  );
}
