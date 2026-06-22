import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionStoreProvider } from '@/lib/stores/sessionStore';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { PlanProvider } from '@/lib/billing/PlanProvider';
import { AppLanguageProvider } from '@/lib/i18n/AppLanguageProvider';
import { CONVERSA_APP_NAME, CONVERSA_ICON_SRC, CONVERSA_SITE_URL } from '@/lib/brand/constants';

const inter = Inter({
  variable: '--font-app',
  subsets: ['latin'],
  display: 'swap',
});

const themeInitScript = `(function(){try{var t=localStorage.getItem('conversationPlatform.theme');document.documentElement.setAttribute('data-theme',t==='nebula-light'?'nebula-light':'nebula-dark');}catch(e){document.documentElement.setAttribute('data-theme','nebula-dark');}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(CONVERSA_SITE_URL),
  title: {
    default: `${CONVERSA_APP_NAME} — Conversaciones multilingües`,
    template: `%s · ${CONVERSA_APP_NAME}`,
  },
  description:
    'Plataforma de conversaciones en tiempo real con traducción automática.',
  openGraph: {
    type: 'website',
    siteName: CONVERSA_APP_NAME,
    url: CONVERSA_SITE_URL,
    title: `${CONVERSA_APP_NAME} — Conversaciones multilingües`,
    description:
      'Plataforma de conversaciones en tiempo real con traducción automática.',
  },
  icons: {
    icon: [{ url: CONVERSA_ICON_SRC, type: 'image/png' }],
    shortcut: [{ url: CONVERSA_ICON_SRC, type: 'image/png' }],
    apple: [{ url: CONVERSA_ICON_SRC, type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: CONVERSA_APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
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
        <link rel="icon" href={CONVERSA_ICON_SRC} type="image/png" />
        <link rel="apple-touch-icon" href={CONVERSA_ICON_SRC} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="touch-root min-h-full flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] font-[family-name:var(--font-app)]">
        <ThemeProvider>
          <AppLanguageProvider>
            <PlanProvider>
              <SessionStoreProvider>{children}</SessionStoreProvider>
            </PlanProvider>
          </AppLanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
