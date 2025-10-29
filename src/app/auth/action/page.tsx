'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const verifyCode = useCallback(async () => {
    try {
      const emailFromCode = await verifyPasswordResetCode(auth, oobCode!);
      setEmail(emailFromCode);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Erro ao verificar código:', error);
      if (error instanceof Error && 'code' in error && error.code === 'auth/expired-action-code') {
        setError('Este link expirou. Solicite um novo link de redefinição.');
      } else {
        setError('Link inválido ou já utilizado.');
      }
      setLoading(false);
    }
  }, [oobCode]);

  useEffect(() => {
    if (!mode || !oobCode) {
      setError('Link inválido ou expirado');
      setLoading(false);
      return;
    }

    if (mode === 'resetPassword') {
      verifyCode();
    } else {
      setError('Ação não suportada');
      setLoading(false);
    }
  }, [mode, oobCode, verifyCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      toast.success('Senha redefinida com sucesso!');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      console.error('Erro ao redefinir senha:', error);
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/weak-password') {
        toast.error('Senha muito fraca. Use uma senha mais forte');
      } else {
        toast.error('Erro ao redefinir senha. Tente novamente');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">Verificando link...</span>
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <CardTitle className="text-2xl">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => router.push('/forgot-password')} className="w-full">
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center justify-items-center">
          <div className="rounded-full w-fit border bg-primary/10 p-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Conta: <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                minLength={6}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...</> : 'Redefinir Senha'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Lembrou a senha? Voltar para Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
