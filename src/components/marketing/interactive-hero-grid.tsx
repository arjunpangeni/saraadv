"use client";

import { useEffect, useRef } from "react";
import styles from "@/components/smoothui/header-4/hero-grid.module.css";

const TOTAL_TILES = 1600;
const INITIAL_TILE = 1;
const TILES_TO_CLONE = TOTAL_TILES - INITIAL_TILE;

const HOVER_COLORS: [string, string, string, string] = [
  "color-mix(in oklab, var(--brand-sky) 55%, transparent)",
  "color-mix(in oklab, var(--brand-navy) 45%, transparent)",
  "color-mix(in oklab, var(--brand-gold) 40%, transparent)",
  "color-mix(in oklab, var(--brand-sky) 35%, transparent)",
];

export function InteractiveHeroGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tile = tileRef.current;
    if (!(container && tile)) return;
    if (container.childElementCount > INITIAL_TILE) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < TILES_TO_CLONE; i++) {
      fragment.appendChild(tile.cloneNode(true));
    }
    container.appendChild(fragment);
  }, []);

  const style = {
    "--hero-grid-hover-color-1": HOVER_COLORS[0],
    "--hero-grid-hover-color-2": HOVER_COLORS[1],
    "--hero-grid-hover-color-3": HOVER_COLORS[2],
    "--hero-grid-hover-color-4": HOVER_COLORS[3],
  } as React.CSSProperties;

  return (
    <div aria-hidden="true" className={styles.gridContainer} style={style}>
      <div className={styles.mainGrid} ref={containerRef}>
        <div className={styles.tile} ref={tileRef} />
      </div>
    </div>
  );
}
