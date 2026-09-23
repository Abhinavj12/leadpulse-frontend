import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "LeadPulse",
  description: "Lead generation and outreach management platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Script 
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} 
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  );
}
