import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/cartProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Lois Tech",
  description:
    "Premium Tech brand - Timeless Tech crafted for modern expression",
  icons: {
    icon: "https://i.imgur.com/IGBf9Dh.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="font-sans bg-white text-black antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}