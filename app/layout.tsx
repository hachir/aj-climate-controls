import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJ Climate Controls | Operations Dashboard",
  description:
    "A data-driven HVAC operations dashboard for equipment health, alarms, service work, and building performance.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
