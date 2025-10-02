export function TemperatureBadge({
  value,
}: {
  value: "dingin" | "hangat" | "panas" | "menyala";
}) {
  const color =
    value === "menyala"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : value === "panas"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : value === "hangat"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs capitalize ${color}`}
    >
      {value}
    </span>
  );
}
