'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { user, signInWithEmailPassword, isAuthorized, isAdmin, isMasterAdmin, loading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Aguarda o carregamento inicial da autenticação
    if (authLoading) {
      console.log('[Login] Aguardando carregamento da autenticação...');
      return;
    }

    console.log('[Login] Estado:', { user: !!user, isAuthorized, isAdmin, isMasterAdmin });

    if (user && isAuthorized) {
      console.log('[Login] Usuário autenticado e autorizado, redirecionando...');
      const redirectPath = (isAdmin || isMasterAdmin) ? '/admin' : '/dashboard';
      
      // Timeout de segurança - força o redirecionamento
      const timeoutId = setTimeout(() => {
        console.log('[Login] Forçando redirecionamento para:', redirectPath);
        window.location.href = redirectPath;
      }, 2000);

      // Tenta redirecionamento normal
      router.push(redirectPath);

      return () => clearTimeout(timeoutId);
    } else if (user && !isAuthorized) {
      console.log('[Login] Usuário autenticado mas não autorizado, redirecionando para unauthorized');
      router.push('/unauthorized');
    }
  }, [user, isAuthorized, router, isAdmin, isMasterAdmin, authLoading]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log('[Login] Verificando email:', email);
      
      // Primeiro verificar se o usuário existe no Firestore
      const checkResponse = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkData = await checkResponse.json();
      console.log('[Login] Resposta da verificação:', checkResponse.status, checkData);

      // Só bloqueia se tiver certeza que não existe (status 404 e exists === false)
      if (checkResponse.status === 404 && checkData.exists === false) {
        console.log('[Login] Email não cadastrado, bloqueando login');
        setError('Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso.');
        setLoading(false);
        return;
      }

      console.log('[Login] Tentando fazer login com Firebase Auth');
      // Se o usuário existe (ou se houve erro na verificação), tentar fazer login
      await signInWithEmailPassword(email, password);
      console.log('[Login] Login bem-sucedido');
    } catch (error: unknown) {
      console.error('[Login] Erro no login:', error);
      const errorMessage = error instanceof Error ? error.message : "Falha no login com email/senha.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // Se ainda está carregando a autenticação, mostra loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se já está logado E autorizado, não mostra a página de login
  if (user && isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Escolha um método de autenticação para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login com Email/Senha */}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="text-right">
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline disabled:opacity-50">
                    Esqueceu a senha?
                  </Link>
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading ? "Carregando..." : "Entrar com Email"}
            </Button>
          </form>


          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center mt-4">
            <p>Apenas usuários autorizados podem acessar o sistema.</p>
            <p>Entre em contato com a DataMat para solicitar acesso.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}