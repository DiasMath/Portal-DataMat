// Arquivo: src/components/ui/header.tsx
"use client";

import React from 'react';
// 1. Importar o novo componente de "recheio"
import { HeaderContent } from './header-content'; 

export const Header = () => {
  return (
    // 2. A barra marrom (o "container")
    <header className="sticky top-0 z-50 w-full h-[42px] bg-[#753838]">
      
      {/* 3. Renderizar o "recheio" aqui dentro */}
      <HeaderContent />

    </header>
  );
};

export default Header;