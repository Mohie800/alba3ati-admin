"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0 pt-14 lg:pt-0">
          <div className="px-4 pb-10 lg:px-8 lg:pt-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
