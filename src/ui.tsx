import { ReactNode } from "react";
import { Row } from "./db";
export const Table = ({ rows, cols }: { rows: Row[]; cols?: string[] }) => {
  const c = cols ?? Object.keys(rows[0] ?? {});
  return rows.length === 0 ? <p className="text-sm text-slate-500 p-3">Empty set (0 rows).</p> : (
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full"><thead><tr>{c.map(k => <th key={k} className="th">{k}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="hover:bg-slate-50">{c.map(k => <td key={k} className="td">{String(r[k])}</td>)}</tr>)}</tbody></table></div>);
};
export const Sql = ({ children }: { children: string }) => <pre className="bg-navy-950 text-gold-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{children}</pre>;
export const Msg = ({ ok, children }: { ok: boolean; children: ReactNode }) =>
  <div role="status" className={`fade rounded-xl px-4 py-2 text-sm font-medium ${ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>{ok ? "✔ " : "✖ "}{children}</div>;
export const H = ({ t, s }: { t: string; s?: string }) => <div className="mb-4"><h2 className="font-display text-2xl font-bold">{t}</h2>{s && <p className="text-sm text-slate-600 mt-1 max-w-2xl">{s}</p>}</div>;
export const Badge = ({ s }: { s: string }) => {
  const g = ["Paid", "DELIVERED", "Delivered"].includes(s), b = ["Pending", "PLACED", "Processing"].includes(s);
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${g ? "bg-emerald-100 text-emerald-800" : b ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{s}</span>;
};
