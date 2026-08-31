"use client";

import { ErrorState } from "@/components/feedback/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState kind="generic" onRetry={reset} />;
}
