export function BuyerTeaserList({ rows }: { rows: { label: string; value: string }[] }) {
  const visible = rows.filter((row) => row.value && row.value !== "—");
  if (visible.length === 0) return null;

  return (
    <dl className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border bg-card">
      {visible.map((row) => (
        <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-xs font-medium tracking-wide text-foreground/50 uppercase">{row.label}</dt>
          <dd className="text-sm leading-relaxed text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ListingMetricGrid({ items }: { items: { label: string; value: string }[] }) {
  const visible = items.filter((item) => item.value && item.value !== "—");
  if (visible.length === 0) return null;

  const cols =
    visible.length === 1 ? "grid-cols-1" : visible.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <dl className={`grid gap-px overflow-hidden rounded-2xl border border-border bg-border ${cols}`}>
      {visible.map((item) => (
        <div key={item.label} className="bg-card px-3 py-3 sm:px-4 sm:py-4">
          <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">{item.label}</dt>
          <dd className="heading-soft mt-1 break-words font-heading text-sm font-semibold tracking-[-0.015em] text-foreground sm:text-lg">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
