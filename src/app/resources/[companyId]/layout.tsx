import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datamat Portal - Recursos",
  description: "Visualize os recursos da sua empresa",
};

export default function ResourcesCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}