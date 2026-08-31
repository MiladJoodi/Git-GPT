"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type SignOutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SignOutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: SignOutConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {t("confirmSignOutTitle")}
          </DialogTitle>
          <DialogDescription>{t("confirmSignOutBody")}</DialogDescription>
        </DialogHeader>

        <p className="border-l-2 border-foreground pl-3 text-sm leading-6 text-muted-foreground">
          {t("confirmSignOutNote")}{" "}
          <Link
            href="/access"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {t("confirmSignOutAccess")}
          </Link>
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
            {t("signOut")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
