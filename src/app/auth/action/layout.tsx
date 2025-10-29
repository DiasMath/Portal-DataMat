import { Suspense } from 'react';

export default function AuthActionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}