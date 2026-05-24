"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteTransaction } from "@lib/actions/transactions";
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

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTransaction(transactionId);
      if (result?.error) {
        setError(result.message);
      }
      // On success, deleteTransaction calls redirect("/transactions")
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Eliminar transacción
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta transacción?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Este registro será eliminado permanentemente y no podrá recuperarse.</p>
              <p>Si pertenece a una transferencia, ambas partes serán eliminadas.</p>
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
          <AlertDialogCancel disabled={isPending}>Cerrar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Sí, eliminar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
