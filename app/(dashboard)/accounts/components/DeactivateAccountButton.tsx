"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, PowerOff } from "lucide-react";
import { deactivateAccount } from "@lib/actions/accounts";
import { Button } from "@components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog";

export function DeactivateAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateAccount(accountId);
      if (result?.error === "HAS_PENDING_TRANSACTIONS") {
        setError(result.message);
        return;
      }
      if (result?.error) {
        setError(result.message);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <PowerOff className="size-4" />
          Desactivar cuenta
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar &ldquo;{accountName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                La cuenta quedará oculta y no podrás registrar nuevas transacciones en ella.
                Todas las transacciones recurrentes asociadas serán pausadas automáticamente.
              </p>
              <p>Podrás reactivarla en cualquier momento desde la página de cuentas.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Desactivando...
              </>
            ) : (
              "Sí, desactivar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
