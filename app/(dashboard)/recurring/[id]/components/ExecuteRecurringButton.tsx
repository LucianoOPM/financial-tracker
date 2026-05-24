"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@components/ui/button";
import { Alert, AlertDescription } from "@components/ui/alert";
import { manualExecuteRecurring } from "@lib/actions/recurring";

interface ExecuteRecurringButtonProps {
  recurringId: string;
  isActive: boolean;
}

export function ExecuteRecurringButton({ recurringId, isActive }: ExecuteRecurringButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleExecute() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await manualExecuteRecurring(recurringId);
      if (result?.error) {
        setError(result.message);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExecute}
        disabled={isPending || !isActive}
      >
        <Play className="size-4" />
        {isPending ? "Ejecutando..." : "Ejecutar ahora"}
      </Button>

      {error && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2 text-xs">
          <AlertDescription>Ejecución completada</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
