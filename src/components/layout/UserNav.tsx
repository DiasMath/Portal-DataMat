"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserNav() {
  const { user, userData, signOut, isAdmin, isMasterAdmin } = useAuth();
  const hasAdminAccess = isAdmin || isMasterAdmin || userData?.permissions?.canEdit;
  const hasCompanyAccess = !!userData?.companyId; // Usuário comum com empresa
  const router = useRouter();

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (!user || !userData) {
    return null;
  }

  const getInitials = () => {
    if (userData.displayName) {
      return userData.displayName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return userData.email[0].toUpperCase();
  };

  const getRoleDisplay = () => {
    switch (userData.role) {
      case "master_admin":
        return "Master Administrador";
      case "admin":
        return "Administrador";
      case "user":
        return "Usuário";
      default:
        return "Usuário";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 shadow-md">
            {user.photoURL && (
              <AvatarImage
                src={user.photoURL}
                alt={userData.displayName || userData.email}
              />
            )}
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userData.displayName || "Usuário"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleDisplay()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {hasAdminAccess && (
            <DropdownMenuItem asChild>
              <Link href="/admin">Painel Administrativo</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          {hasCompanyAccess && (
            <DropdownMenuItem asChild>
              <Link href="/resources">Recursos</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

