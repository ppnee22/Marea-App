import { auth } from "@/auth";
import { Sidebar, MobileHeader, MobileTabBar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar userEmail={session?.user?.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader userEmail={session?.user?.email} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
