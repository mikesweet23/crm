import { AppNav } from "@/components/layout/AppNav";
import { getSession, isDemoMode } from "@/lib/data/crm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-full flex flex-col">
      <AppNav
        userName={session.profile?.full_name ?? session.user.email}
        demoMode={isDemoMode()}
      />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
