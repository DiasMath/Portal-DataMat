import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DataMat Portal",
  description: "Visualize os dashboards da sua empresa",
};

export default function DashboardSpecificLayout({
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