import { AppShell } from "@/components/app/app-shell";
import { GithubDataProvider } from "@/components/app/github-data-provider";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GithubDataProvider>
      <AppShell>{children}</AppShell>
    </GithubDataProvider>
  );
}
