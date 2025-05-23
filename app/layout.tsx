// app/layout.tsx
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeProvider from '../components/theme/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Metadata for the application
export const metadata: Metadata = {
  title: 'ChatsAssistant - Admin Dashboard',
  description: 'Admin dashboard for managing creators and chat suggestions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}