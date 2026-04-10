import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DataMat Portal",
  description: "Visualize os dashboards da sua empresa",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}