import { ListProvider } from "@/context/ListContext";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PKJs-Movies",
  description: "binge till you die",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <ListProvider>
          {children}
        </ListProvider>
      </body>
    </html>
  );
}