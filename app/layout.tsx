import type { Metadata } from "next";
import "./globals.css";

const themeScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("aj-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var useDark = savedTheme ? savedTheme === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", useDark);
      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    } catch (error) {}
  })();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
