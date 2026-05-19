import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import CreateAccountForm from "./components/CreateAccountForm";

export default function CreateAccountPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 mb-1 w-fit text-muted-foreground"
        >
          <Link href="/accounts">
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a cuentas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Agrega una nueva cuenta financiera
        </p>
      </div>
      <CreateAccountForm />
    </div>
  );
}
