"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

type AccountEntry = {
  githubUserId: number;
  login: string;
  active: boolean;
};

export function AccountsSwitcher() {
  const router = useRouter();
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/accounts", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setAccounts([]);
        return;
      }
      const body = (await response.json()) as { accounts: AccountEntry[] };
      setAccounts(body.accounts ?? []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchAccount(githubUserId: number) {
    setBusyId(githubUserId);
    try {
      const response = await fetch("/api/auth/accounts", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "switch", githubUserId }),
      });
      if (!response.ok) {
        toast.error(t("errorFailed"));
        return;
      }
      toast.success(t("accountsSwitch"));
      router.refresh();
      window.location.reload();
    } finally {
      setBusyId(null);
    }
  }

  async function removeAccount(githubUserId: number) {
    setBusyId(githubUserId);
    try {
      const response = await fetch("/api/auth/accounts", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "remove", githubUserId }),
      });
      if (!response.ok) {
        toast.error(t("errorFailed"));
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium">{t("accountsSwitcher")}</p>
      <ul className="mt-2 divide-y divide-border rounded-md border border-border">
        {accounts.map((account) => (
          <li
            key={account.githubUserId}
            className="flex items-center justify-between gap-2 px-3 py-2.5"
          >
            <span className="min-w-0 truncate text-sm">
              @{account.login}
              {account.active ? (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3" aria-hidden="true" />
                  {t("accountsActive")}
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {!account.active ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-sm"
                  disabled={busyId !== null}
                  aria-busy={busyId === account.githubUserId}
                  onClick={() => void switchAccount(account.githubUserId)}
                >
                  {busyId === account.githubUserId ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    t("accountsSwitch")
                  )}
                </Button>
              ) : null}
              {!account.active ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-sm px-2"
                  disabled={busyId !== null}
                  aria-label={`${t("accountsRemove")} @${account.login}`}
                  onClick={() => void removeAccount(account.githubUserId)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <a
        href="/login"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("accountsAdd")}
      </a>
    </div>
  );
}
