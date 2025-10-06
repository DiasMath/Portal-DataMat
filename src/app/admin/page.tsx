import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RegisterForm } from "@/components/ui/register-form";
import { headers } from 'next/headers';

type Role = "master_admin" | "admin" | "user";

interface User {
    uid: string;
    email: string;
    role: Role;
}

export default async function AdminPage() {
  const headersList = await headers();
  const userPayload = headersList.get('x-user');
  const user: User | null = userPayload ? JSON.parse(userPayload) : null;

  return (
    <main className="p-4 sm:p-8 md:p-12 min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="text-3xl">Painel de Administração</CardTitle>
                        <CardDescription>
                            Bem-vindo ao painel de administração. Gerencie seu conteúdo e usuários aqui.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Esta é a área principal de gerenciamento para administradores.</p>
                    {/* Conteúdo específico para admins vai aqui */}
                </CardContent>
            </Card>

            {user && user.role === 'master_admin' && (
                <div className="mt-8">
                    <RegisterForm />
                </div>
            )}
        </div>
    </main>
  );
}