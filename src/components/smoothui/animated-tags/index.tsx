"use client";

import { CircleX, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

export interface AnimatedTagsProps {
  className?: string;
  initialTags?: string[];
  onChange?: (selected: string[]) => void;
  selectedTags?: string[];
  /** Read-only chips — used on Project Bank cards and desk rows. */
  variant?: "picker" | "chips";
}

const TAG_SPRING = { bounce: 0, duration: 0.25, type: "spring" as const };

export default function AnimatedTags({
  initialTags = ["react", "tailwindcss", "javascript"],
  selectedTags: controlledSelectedTags,
  onChange,
  className = "",
  variant = "picker",
}: AnimatedTagsProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const selectedTag = controlledSelectedTags ?? (variant === "chips" ? initialTags : internalSelected);

  if (variant === "chips") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <AnimatePresence>
          {selectedTag.map((tag) => (
            <motion.span
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { filter: "blur(0px)", opacity: 1, y: 0 }
              }
              className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { filter: "blur(4px)", opacity: 0, y: 8 }
              }
              key={tag}
              layout
              transition={shouldReduceMotion ? { duration: 0 } : TAG_SPRING}
            >
              {tag}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    );
  }
  const tags = initialTags.filter((tag) => !selectedTag.includes(tag));

  const handleTagClick = (tag: string) => {
    const newSelected = [...selectedTag, tag];
    if (onChange) {
      onChange(newSelected);
    } else {
      setInternalSelected(newSelected);
    }
  };
  const handleDeleteTag = (tag: string) => {
    const newSelectedTag = selectedTag.filter((selected) => selected !== tag);
    if (onChange) {
      onChange(newSelectedTag);
    } else {
      setInternalSelected(newSelectedTag);
    }
  };
  return (
    <div className={`flex w-[300px] flex-col gap-4 p-4 ${className}`}>
      <div className="flex flex-col items-start justify-center gap-1">
        <p>Selected Tags</p>
        <AnimatePresence>
          <div className="flex min-h-12 w-full flex-wrap items-center gap-1 rounded-xl border bg-background p-2">
            {selectedTag?.map((tag) => (
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        filter: "blur(0px)",
                        opacity: 1,
                        y: 0,
                      }
                }
                className="group flex cursor-pointer flex-row items-center justify-center gap-2 rounded-md border bg-primary px-2 py-1 text-primary-foreground group-hover:bg-primary group-hover:text-foreground"
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { filter: "blur(4px)", opacity: 0, y: 20 }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { filter: "blur(4px)", opacity: 0, y: 20 }
                }
                key={tag}
                layout
                onClick={() => handleDeleteTag(tag)}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { bounce: 0, duration: 0.25, type: "spring" as const }
                }
              >
                {tag}{" "}
                <CircleX
                  className="ease flex items-center justify-center rounded-full transition-all duration-200"
                  size={16}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }
              }
              className="group flex cursor-pointer flex-row items-center justify-center gap-2 rounded-md border bg-background px-2 py-1 text-primary-foreground"
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { filter: "blur(4px)", opacity: 0, y: -20 }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { filter: "blur(4px)", opacity: 0, y: -20 }
              }
              key={tag}
              layout
              onClick={() => handleTagClick(tag)}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { bounce: 0, duration: 0.25, type: "spring" as const }
              }
            >
              {tag}{" "}
              <Plus
                className="ease @media (hover: hover) and (pointer: flex items-center justify-center rounded-full transition-all duration-200 fine):hover:bg-primary group-hover:text-foreground"
                size={16}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
