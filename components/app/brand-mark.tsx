import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  title = "Follow Manager",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center bg-foreground font-mono text-[11px] font-medium tracking-wide text-background",
        className,
      )}
      role="img"
      aria-label={title}
    >
      FM
    </span>
  );
}
