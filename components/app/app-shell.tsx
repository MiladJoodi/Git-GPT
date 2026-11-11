import { BottomNav } from "@/components/navigation/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-background">
      <div className="mx-auto flex h-dvh w-full flex-col md:max-w-3xl lg:max-w-5xl">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-5 pb-2 md:px-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
