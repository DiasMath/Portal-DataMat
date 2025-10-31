// Arquivo: src/components/ui/header-content.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { UserNav } from './user-nav';

// Este componente é o "recheio" da sua navbar
export const HeaderContent = () => {
  return (
    <div className="flex h-full items-center px-4">
      
      {/* Link "Home" com ícone */}
      <Link 
        href="/admin" 
        className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <Home className="h-5 w-5" />
        <span className="font-medium text-sm">Home</span>
      </Link>

      {/* Menu de usuário alinhado à direita */}
      <div className="ml-auto flex items-center space-x-4">
        <UserNav />
      </div>
    </div>
  );
};