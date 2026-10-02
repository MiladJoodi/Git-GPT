"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCount } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";

type BranchDeleteConfirmDialogProps = {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BranchDeleteConfirmDialog({
  open,
  count,
  onOpenChange,
  onConfirm,
}: BranchDeleteConfirmDialogProps) {
  const { t } = useI18n();
  const [typed, setTyped] = useState("");
  const branches = count === 1 ? t("branchOne") : t("branchMany");
  const confirmWord = t("confirmDeleteConfirmWord");
  const canConfirm = typed.trim().toLowerCase() === confirmWord;

  function close(next: boolean) {
    if (!next) setTyped("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {t("confirmDeleteBranchesTitle", {
              count: formatCount(count),
              branches,
            })}
          </DialogTitle>
          <DialogDescription>{t("confirmDeleteBranchesBody")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-muted-foreground">
            {t("confirmDeleteWarning")}
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmWord}
            autoComplete="off"
            aria-label={t("confirmDeleteWarning")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={() => {
              setTyped("");
              onOpenChange(false);
              onConfirm();
            }}
          >
            {t("confirmDeleteBranchesAction", { count: formatCount(count) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
