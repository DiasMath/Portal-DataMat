import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-heading font-bold text-[#FFB03F] opacity-50">404</div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-white">Página não encontrada</h1>
          <p className="text-gray-400 font-body">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="py-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-[#1a1a1a] border border-[#FFB03F]/20 flex items-center justify-center text-6xl">
            😵
          </div>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#FFB03F] text-black font-heading font-medium px-6 py-3 rounded-md hover:bg-[#FFB03F]/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            Voltar ao Início
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-500 font-body">
          <span className="text-white font-datamat">DATA</span><span className="text-[#FFB03F] font-datamat">MAT</span>
        </div>
      </div>
    </div>
  );
}