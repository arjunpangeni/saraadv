"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY = "__empty__";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  id,
  name,
  wrapItems,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  wrapItems?: boolean;
  "aria-label"?: string;
}) {
  const radixValue = value === "" ? EMPTY : value;

  return (
    <Select
      value={radixValue}
      onValueChange={(next) => onValueChange(next === EMPTY ? "" : next)}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        size="default"
        className={cn("h-10 w-full min-w-0 overflow-hidden", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className={
          wrapItems
            ? "max-h-[min(18rem,60vh)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1.5rem)]"
            : "max-h-72"
        }
      >
        {!options.some((option) => option.value === "") && (
          <SelectItem value={EMPTY} className="hidden">
            {placeholder ?? " "}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem
            key={option.value || EMPTY}
            value={option.value === "" ? EMPTY : option.value}
            disabled={option.disabled}
            className={wrapItems ? "items-start whitespace-normal py-2 *:[span]:last:items-start *:[span]:last:whitespace-normal" : undefined}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
