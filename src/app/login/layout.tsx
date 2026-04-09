import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datamat Portal",
  description: "Acesse o portal DataMat",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #0d0f12 0%, #1a1d22 50%, #0d0f12 100%)',
        }}
    >
      {children}
    </div>
  );
}