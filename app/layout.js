"use client";
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "./Footer/page"; 
import Header from "@/components/Header";
import { usePathname } from "next/navigation";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Hide header and footer for dashboard/user routes and login pages
  const hiddenRoutes = ['/user', '/company', '/userlogin', '/signup'];
  const shouldHideLayout = hiddenRoutes.some(route => pathname?.startsWith(route));

  return (
   
    <html lang="en">
      <head>
        <title>BillGenius - All-In-One Billing Software</title>
        <meta name="description" content="Complete billing and invoicing solution for any business. Manage inventory, sales, customers, and payments efficiently." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        {!shouldHideLayout && <Header />}
        {children}
        {!shouldHideLayout && <Footer />}
      </body>
     
    </html>
    
  );
}
