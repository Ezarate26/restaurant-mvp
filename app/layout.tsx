import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionStoreProvider } from '@/lib/stores/sessionStore';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

const inter = Inter({
  variable: '--font-app',
  subsets: ['latin'],
  display: 'swap',
});

const themeInitScript = `(function(){try{var t=localStorage.getItem('conversationPlatform.theme');document.documentElement.setAttribute('data-theme',t==='nebula-light'?'nebula-light':'nebula-dark');}catch(e){document.documentElement.setAttribute('data-theme','nebula-dark');}})();`;

export const metadata: Metadata = {
  title: 'Conversa — Conversaciones multilingües',
  description:
    'Plataforma de conversaciones en tiempo real con traducción automática.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Conversa',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#12131A' },
    { media: '(prefers-color-scheme: light)', color: '#F8F9FD' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
      data-theme="nebula-dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="touch-root min-h-full flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] font-[family-name:var(--font-app)]">
        <ThemeProvider>
          <SessionStoreProvider>{children}</SessionStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
