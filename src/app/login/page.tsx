"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

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
    if (authLoading) return;

    if (user && isAuthorized) {
      const redirectPath = (isAdmin || isMasterAdmin) ? '/admin' : '/dashboard';
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
      const checkResponse = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkData = await checkResponse.json();
      if (isDev) {
        console.log('[Login] Resposta da verificação:', checkResponse.status, checkData);
      }

      if (checkResponse.status === 404 && checkData.exists === false) {
        setError('Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso.');
        setLoading(false);
        return;
      }

      await signInWithEmailPassword(email, password);
    } catch (error: unknown) {
      console.error('[Login] Erro no login:', error);
      const errorMessage = error instanceof Error ? error.message : "Falha no login com email/senha.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-text"></div>
      </div>
    );
  }

  if (user && isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-text"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-[#1a1a1a] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[90vh] lg:h-[700px]">
        
        {/* Lado Esquerdo - Branding */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 md:w-40 md:h-40 bg-yellow-text rounded-full blur-3xl -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 md:w-60 md:h-60 bg-yellow-text rounded-full blur-3xl translate-x-20 translate-y-20"></div>
          </div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-8 rounded-xl md:rounded-2xl bg-[#FFB03F]/10 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="DataMat"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            
            {/* DATA MAT */}
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight">
              <span className="text-white">DATA</span>
              <span className="text-yellow-text">MAT</span>
            </h1>
            
            {/* Divider */}
            <div className="w-20 md:w-24 h-1 bg-yellow-text mt-4 md:mt-6 mb-4 md:mb-6"></div>
            
            {/* Slogan */}
            <p className="text-base md:text-xl text-gray-400">
              <span className="text-white font-medium">Do dado à decisão.</span>
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-auto">
            <p className="text-xs md:text-sm text-gray-500 max-w-[200px] md:max-w-xs">
              Transformamos dados em insights estratégicos para impulsionar o seu negócio.
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Título */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Entrar</h2>
              <p className="text-sm md:text-base text-gray-400">Acesse o portal de dados da sua empresa.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 md:pl-10 bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-text focus:ring-yellow-text focus:ring-2 focus:ring-yellow-text/30 outline-none transition-all text-sm md:text-base py-2 md:py-2.5"
                  />
                </div>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="password" className="text-sm md:text-base text-gray-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 md:pl-10 pr-9 md:pr-10 bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-text focus:ring-yellow-text focus:ring-2 focus:ring-yellow-text/30 outline-none transition-all text-sm md:text-base py-2 md:py-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full bg-yellow-text text-black font-semibold py-2.5 md:py-3 text-sm md:text-lg hover:bg-yellow-text/90 transition-colors"
                disabled={loading || !email || !password}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs md:text-sm text-gray-400 hover:text-yellow-text transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 md:mt-6 bg-red-500/10 border border-red-500/20 text-red-400 px-3 md:px-4 py-2 md:py-3 rounded-lg">
                <p className="text-xs md:text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}