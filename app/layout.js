"use client";

import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";

const RootLayout = ({ children }) => {
  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
};
export default RootLayout;
