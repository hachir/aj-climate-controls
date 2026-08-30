import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJ Climate Controls | Commercial HVAC Automation",
  description:
    "Commercial HVAC controls, building automation, BACnet integration, VFD optimization, commissioning, and system diagnostics.",
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
