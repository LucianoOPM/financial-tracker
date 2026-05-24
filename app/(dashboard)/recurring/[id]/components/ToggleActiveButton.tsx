"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PauseCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { deactivateRecurring, reactivateRecurring } from "@lib/actions/recurring";

interface ToggleActiveButtonProps {
  recurringId: string;
  isActive: boolean;
}

export function ToggleActiveButton({ recurringId, isActive }: ToggleActiveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (isActive) {
        await deactivateRecurring(recurringId);
      } else {
        await reactivateRecurring(recurringId);
      }
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {isActive ? (
          <PauseCircle className="size-4" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {isActive ? "Desactivar" : "Activar"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "¿Desactivar recurrente?" : "¿Activar recurrente?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? "El programador dejará de procesar esta transacción hasta que la reactives."
                : "El programador volverá a procesar esta transacción en la próxima fecha programada."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={isPending}>
              {isActive ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
