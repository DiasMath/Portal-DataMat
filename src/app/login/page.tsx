"use client";

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
import { Eye, EyeOff } from "lucide-react";

const isDev = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const { user, signInWithEmailPassword, isAuthorized, isAdmin, isMasterAdmin, loading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Aguarda o carregamento inicial da autenticação
    if (authLoading) {
      return;
    }

    if (user && isAuthorized) {
      const redirectPath = (isAdmin || isMasterAdmin) ? '/admin' : '/dashboard';
      
      // Timeout de segurança - força o redirecionamento
      const timeoutId = setTimeout(() => {
        window.location.href = redirectPath;
      }, 2000);

      router.push(redirectPath);

      return () => clearTimeout(timeoutId);
    } else if (user && !isAuthorized) {
      router.push('/unauthorized');
    }
  }, [user, isAuthorized, router, isAdmin, isMasterAdmin, authLoading]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Primeiro verificar se o usuário existe no Firestore
      const checkResponse = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkData = await checkResponse.json();
      if (isDev) {
        console.log('[Login] Resposta da verificação:', checkResponse.status, checkData);
      }

      // Só bloqueia se tiver certeza que não existe (status 404 e exists === false)
      if (checkResponse.status === 404 && checkData.exists === false) {
        setError('Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso.');
        setLoading(false);
        return;
      }

      // Se o usuário existe (ou se houve erro na verificação), tentar fazer login
      await signInWithEmailPassword(email, password);
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
      <div className="flex items-center justify-center h-[calc(100vh-42px)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text"></div>
      </div>
    );
  }

  // Se já está logado E autorizado, não mostra a página de login
  if (user && isAuthorized) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-42px)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-42px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading ? "Carregando..." : "Entrar"}
            </Button>
          </form>


          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center mt-4">
            <p>Apenas usuários autorizados podem acessar o portal.</p>
            <p>Entre em contato com a DataMat para solicitar acesso.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}