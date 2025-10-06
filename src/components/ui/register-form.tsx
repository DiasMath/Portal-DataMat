"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [dashboardLink, setDashboardLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role, dashboardLink }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Usuário criado com sucesso!");
        // Clear form
        setEmail("");
        setPassword("");
        setRole("user");
        setDashboardLink("");
      } else {
        setError(data.message || "Falha ao criar usuário.");
      }
    } catch (error) {
      setError("Erro ao criar usuário: " + error);
    }
  };

  return (
    <Card className="w-full max-w-lg mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Criar Novo Usuário</CardTitle>
        <CardDescription>
          Preencha os dados para registrar um novo usuário no sistema.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={setRole} defaultValue={role}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="master_admin">Master Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboardLink">Link do Dashboard</Label>
            <Input
              id="dashboardLink"
              type="text"
              placeholder="/dashboard/link-especifico"
              required
              value={dashboardLink}
              onChange={(e) => setDashboardLink(e.target.value)}
            />
          </div>
          {message && <p className="text-green-500 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="pt-4">
          <Button className="w-full" type="submit">
            Criar Usuário
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
