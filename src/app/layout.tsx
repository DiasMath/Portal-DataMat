// Arquivo: src/app/layout.tsx
"use client"; 

import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

//
// --- A CORREÇÃO ESTÁ AQUI ---
//
// O nome correto do seu componente de contexto é 'AuthProvider',
// como definido em 'src/contexts/AuthContext.tsx'
import { AuthProvider } from '@/contexts/AuthContext';
//
// --- FIM DA CORREÇÃO ---
//

import { Toaster } from '@/components/ui/sonner';
import './globals.css';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/ui/header';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const pathname = usePathname();
  const isFullscreenPage = pathname === '/dashboard' || pathname === '/report';

  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/*
          // --- A CORREÇÃO ESTÁ AQUI ---
          // Usando o componente <AuthProvider> correto
          */}
          <AuthProvider>
            
            {/* Se NÃO for a página do dashboard, renderiza o Header */}
            {!isFullscreenPage && <Header />}

            {/* Se FOR a página do dashboard, renderiza SÓ as children.
                Se NÃO FOR, renderiza as children com o padding. */}
            {isFullscreenPage ? (
              children // <-- Tela cheia, sem padding
            ) : (
              <div className="flex-1 space-y-4 p-8 pt-6"> {/* <-- Layout normal com padding */}
                {children}
              </div>
            )}
            
            <Toaster />
          
          {/* // --- FIM DA CORREÇÃO --- */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}