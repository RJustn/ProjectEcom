import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import CartSidebar from "./components/CartSidebar";
import ConditionalFooter from "./components/ConditionalFooter";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CartProvider>
            <CartSidebar />
            {children}
            <ConditionalFooter />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}