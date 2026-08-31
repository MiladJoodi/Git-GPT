"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";

type UnfollowConfirmDialogProps = {
  open: boolean;
  count: number;
  mode?: "selected" | "all" | "nonFollowers";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function UnfollowConfirmDialog({
  open,
  count,
  mode = "selected",
  onOpenChange,
  onConfirm,
}: UnfollowConfirmDialogProps) {
  const { t } = useI18n();
  const accounts = count === 1 ? t("accountOne") : t("accountMany");
  const formatted = formatCount(count);
  const isAll = mode === "all" || mode === "nonFollowers";

  const title =
    mode === "nonFollowers"
      ? t("confirmUnfollowAllTitle")
      : mode === "all"
        ? t("confirmUnfollowEveryoneTitle", {
            count: formatted,
            accounts,
          })
        : t("confirmUnfollowTitle", {
            count: formatted,
            accounts,
          });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
          <DialogDescription>{t("confirmUnfollowBody")}</DialogDescription>
        </DialogHeader>

        <p className="border-l-2 border-foreground pl-3 text-sm leading-6 text-muted-foreground">
          {t("confirmUnfollowWarning")}
          {isAll || count > 10 ? (
            <span className="mt-2 block">{t("confirmUnfollowSlowNote")}</span>
          ) : null}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {t("confirmUnfollowAction", { count: formatted })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
