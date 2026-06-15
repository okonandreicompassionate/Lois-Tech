import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/cartProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata = {
  title: "EXILES - TOTEME",
  description:
    "Premium fashion brand - Timeless style crafted for modern expression",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head></head>
      <body className="font-sans bg-white text-white antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}