import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccessScreen } from "@/components/access/access-screen";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { readSessionFromValue } from "@/lib/auth/session-cookie";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: translate("accessTitle"),
  description: translate("accessLead"),
};

export default async function AccessPage() {
  const session = await readSessionFromValue(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );

  return <AccessScreen signedIn={Boolean(session)} />;
}
