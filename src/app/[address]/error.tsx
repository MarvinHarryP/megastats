"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        Could not load wallet data. The address may be invalid or the API may be temporarily unavailable.
      </p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
