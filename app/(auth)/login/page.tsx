import type { Metadata } from "next";
import { LoginScreen } from "@/components/login/login-screen";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: translate("brand"),
  description: translate("loginTrust"),
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return <LoginScreen error={error} />;
}
