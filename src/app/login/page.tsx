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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithMicrosoft, signInWithGitHub, signInWithEmailPassword, isAuthorized } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user && isAuthorized) {
      router.push('/dashboard');
    } else if (user && !isAuthorized) {
      router.push('/unauthorized');
    }
  }, [user, isAuthorized, router]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailPassword(email, password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Falha no login com email/senha.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Falha no login com Google.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithMicrosoft();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Falha no login com Microsoft.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGitHub();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Falha no login com GitHub.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Se já está logado, não mostra a página de login
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
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
            </div>
            <Button 
              type="submit"
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading ? "Carregando..." : "Entrar com Email"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          
          {/* Login com Provedores */}
          <Button 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Entrar com Google"}
          </Button>
          
          <Button 
            className="w-full" 
            onClick={handleMicrosoftLogin}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Carregando..." : "Entrar com Microsoft"}
          </Button>
          
          <Button 
            className="w-full" 
            onClick={handleGitHubLogin}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Carregando..." : "Entrar com GitHub"}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center mt-4">
            <p>Apenas usuários autorizados podem acessar o sistema.</p>
            <p>Entre em contato com o administrador para solicitar acesso.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}