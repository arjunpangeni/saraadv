"use client";

import { useEffect, useRef } from "react";
import styles from "@/components/smoothui/header-4/hero-grid.module.css";

/** 20×20 keeps the hover grid look without ~1600 DOM nodes on first paint. */
const GRID = 20;
const TOTAL_TILES = GRID * GRID;
const INITIAL_TILE = 1;
const TILES_TO_CLONE = TOTAL_TILES - INITIAL_TILE;

const HOVER_COLORS: [string, string, string, string] = [
  "color-mix(in oklab, var(--tz-green-deep) 55%, transparent)",
  "color-mix(in oklab, var(--tz-pink-deep) 45%, transparent)",
  "color-mix(in oklab, var(--tz-gold) 40%, transparent)",
  "color-mix(in oklab, var(--tz-blue-deep) 45%, transparent)",
];

export function InteractiveHeroGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tile = tileRef.current;
    if (!(container && tile)) return;
    if (container.childElementCount > INITIAL_TILE) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilesToClone = reduced ? Math.min(TILES_TO_CLONE, 99) : TILES_TO_CLONE;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < tilesToClone; i++) {
      fragment.appendChild(tile.cloneNode(true));
    }
    container.appendChild(fragment);
  }, []);

  const style = {
    "--hero-grid-hover-color-1": HOVER_COLORS[0],
    "--hero-grid-hover-color-2": HOVER_COLORS[1],
    "--hero-grid-hover-color-3": HOVER_COLORS[2],
    "--hero-grid-hover-color-4": HOVER_COLORS[3],
    "--hero-grid-size": GRID,
  } as React.CSSProperties;

  return (
    <div aria-hidden="true" className={styles.gridContainer} style={style}>
      <div className={styles.mainGrid} ref={containerRef}>
        <div className={styles.tile} ref={tileRef} />
      </div>
    </div>
  );
}
