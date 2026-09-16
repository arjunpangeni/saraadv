"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-20">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred. Try again, or use one of the links below."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="sky" onClick={() => retry()}>
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go home</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
