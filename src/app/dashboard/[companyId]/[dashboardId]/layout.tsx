import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datamat Portal",
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