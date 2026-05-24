"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";

interface DatePickerFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled,
  "aria-invalid": ariaInvalid,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? parseLocalDate(value) : undefined;

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(toDateString(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
