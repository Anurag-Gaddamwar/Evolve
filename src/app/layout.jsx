// use system font stack for Apple/Google design
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from 'react-hot-toast';

// no external font; rely on system-ui

export const metadata = {
  title: "EVOLVE",
  description: "Developed by Anurag Gaddamwar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="theme-transition font-sans overflow-x-hidden h-full">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" reverseOrder={false} />
        </ThemeProvider>
      </body>
    </html>
  );
}
