"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <label htmlFor="people-search" className="sr-only">
        {t("search")}
      </label>
      <Input
        id="people-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("search")}
        autoComplete="off"
        className="h-9 rounded-none border-0 border-b border-border bg-transparent px-0 text-base shadow-none md:text-sm"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 end-0 -translate-y-1/2 cursor-pointer"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
