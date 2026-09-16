"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const selected = options.find((option) => option.value === value);

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/30 dark:hover:bg-input/50",
            "[&_svg]:pointer-events-none [&_svg]:shrink-0",
            className
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              !selected && "text-muted-foreground"
            )}
          >
            {selected?.label ?? placeholder ?? "Select"}
          </span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={{ top: 88, bottom: 24, left: 8, right: 8 }}
          className={cn(
            "z-[60] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]",
            wrapItems
              ? "max-h-[min(18rem,50vh)] max-w-[calc(100vw-1.5rem)]"
              : "max-h-60"
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value || "__empty__"}
                disabled={option.disabled}
                onSelect={() => onValueChange(option.value)}
                className={cn(
                  "pr-8",
                  wrapItems &&
                    "items-start whitespace-normal py-2 *:[span]:last:items-start *:[span]:last:whitespace-normal"
                )}
              >
                <span className="min-w-0 flex-1">{option.label}</span>
                {isSelected ? (
                  <CheckIcon className="absolute right-2 size-4 shrink-0" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
