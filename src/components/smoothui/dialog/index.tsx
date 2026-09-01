"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useState } from "react";

const SPRING_PANEL = {
  bounce: 0.05,
  duration: 0.25,
  type: "spring" as const,
};

const BACKDROP_DURATION = 0.2;

export interface DialogProps {
  children?: React.ReactNode;
  className?: string;
  description?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  showCloseButton?: boolean;
  title?: string;
  trigger?: React.ReactNode;
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  showCloseButton = true,
  className,
  children,
  trigger,
}: DialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}

      <AnimatePresence>
        {isOpen ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : BACKDROP_DURATION }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
                }
                className={cn(
                  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border border-border bg-background p-6 shadow-lg sm:max-w-md",
                  className
                )}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : {
                        opacity: 0,
                        transform: "translate(-50%, -50%) scale(0.95)",
                        transition: { duration: 0.15 },
                      }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
                    : { opacity: 0, transform: "translate(-50%, -48%) scale(0.95)" }
                }
                transition={shouldReduceMotion ? { duration: 0 } : SPRING_PANEL}
              >
                {title || description ? (
                  <div className="pr-8">
                    {title ? (
                      <DialogPrimitive.Title className="font-display text-lg font-bold tracking-tight text-foreground">
                        {title}
                      </DialogPrimitive.Title>
                    ) : (
                      <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
                    )}
                    {description ? (
                      <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </DialogPrimitive.Description>
                    ) : null}
                  </div>
                ) : (
                  <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
                )}

                {children}

                {showCloseButton ? (
                  <DialogPrimitive.Close asChild>
                    <motion.button
                      aria-label="Close dialog"
                      className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { rotate: 90 }}
                    >
                      <X className="size-5" />
                    </motion.button>
                  </DialogPrimitive.Close>
                ) : null}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
