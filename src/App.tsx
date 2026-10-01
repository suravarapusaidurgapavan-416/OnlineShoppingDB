import { useState } from "react";
import Shop from "./Shop";
import { PAGES, Dashboard, Crud, SqlOps, Advanced, Views, Integrity, ER, Evidence } from "./Admin";
import { db, useDb } from "./db";
import { Table, Sql } from "./ui";

const SLIDES: { t: string; explain: string; example: string; visual: (props?: { only?: string[] }) => JSX.Element }[] = [
  { t: "Database & Tables", explain: "OnlineShoppingDB stores everything in 8 related tables. Each table holds one kind of fact.", example: "CREATE TABLE PRODUCT (Product_ID INT PRIMARY KEY, Name VARCHAR(80), Price DECIMAL(10,2), Stock INT, Category_ID INT, FOREIGN KEY (Category_ID) REFERENCES CATEGORY(Category_ID));", visual: () => <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.keys(db).map(t => <div key={t} className="card !p-3 text-center"><b>{t}</b><p className="text-xs text-slate-500">{db[t].length} rows</p></div>)}</div> },
  { t: "Sample Data", explain: "Realistic rows let us test every feature.", example: "INSERT INTO PRODUCT VALUES (201,'Wireless Headphones',1499,25,1);", visual: () => <Table rows={db.PRODUCT} /> },
  { t: "SQL Operations", explain: "DDL = structure, DML = data, DQL = retrieval.", example: "ALTER TABLE PRODUCT ADD Brand VARCHAR(40);  -- DDL\nUPDATE PRODUCT SET Stock=20 WHERE Product_ID=201;  -- DML\nSELECT * FROM PRODUCT;  -- DQL", visual: SqlOps },
  { t: "CRUD Operations", explain: "Create, Read, Update, Delete — try them live.", example: "INSERT / SELECT / UPDATE / DELETE on PRODUCT", visual: Crud },
  { t: "Advanced Queries", explain: "JOIN combines tables; aggregates summarise rows.", example: "SELECT o.Order_ID, c.Name FROM ORDERS o JOIN CUSTOMER c ON o.Customer_ID=c.Customer_ID;", visual: Advanced },
  { t: "Database View", explain: "A view is a saved query that acts like a table.", example: "CREATE VIEW OrderSummary AS SELECT ... ;", visual: Views },
  { t: "Data Integrity", explain: "Rules keep data correct: PK, FK, NOT NULL, UNIQUE, CHECK.", example: "INSERT INTO PRODUCT VALUES (201, ...);  -- rejected: duplicate PK", visual: Integrity },
  { t: "ER Diagram", explain: "Shows how tables connect through keys.", example: "CATEGORY 1—N PRODUCT, CUSTOMER 1—N ORDERS, ORDERS 1—N ORDER_ITEM", visual: ER },
  { t: "Evidence & Demo", explain: "Scripts, results and screenshots for the report.", example: "Open the shop, place an order, then see it in ORDERS, PAYMENT and DELIVERY.", visual: Evidence }];

function Present({ onExit }: { onExit: () => void }) { useDb(); const [i, setI] = useState(0); const s = SLIDES[i]; const V = s.visual;
  return <div className="min-h-screen bg-slate-50"><div className="bg-navy-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10"><b className="font-display text-gold-400">Presentation</b><span className="text-sm text-white/70">{i + 1} / {SLIDES.length}</span><button className="btn-ghost !py-1 ml-auto" onClick={onExit}>Exit</button></div>
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-5 fade" key={i}><h1 className="font-display text-3xl font-bold">{s.t}</h1>
      <div className="card"><p className="font-semibold">Explanation</p><p className="text-slate-700">{s.explain}</p></div><div><p className="font-semibold mb-1">Example</p><Sql>{s.example}</Sql></div>
      <div><p className="font-semibold mb-1">Visual and result</p><V /></div>
      <div className="flex justify-between pt-2"><button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button><button className="btn-gold" disabled={i === SLIDES.length - 1} onClick={() => setI(i + 1)}>Next</button></div></div></div>; }

export default function App() {
  const [mode, setMode] = useState<"shop" | "admin" | "present">("shop"); const [uid, setUid] = useState<number | null>(null); const [pg, setPg] = useState("dash"); const [open, setOpen] = useState(false);
  if (mode === "present") return <Present onExit={() => setMode("admin")} />;
  if (mode === "shop") return <><Shop uid={uid} setUid={setUid} /><div className="fixed bottom-4 right-4 flex gap-2 z-20"><button className="btn-navy shadow-lg" onClick={() => setMode("admin")}>Admin / DBMS</button><button className="btn-gold shadow-lg" onClick={() => setMode("present")}>Presentation Mode</button></div></>;
  const Page = PAGES.find(p => p[1] === pg)![2];
  return <div className="min-h-screen md:flex"><aside className={`bg-navy-900 text-white md:w-60 md:min-h-screen md:block ${open ? "block" : "hidden"} md:sticky md:top-0 md:h-screen overflow-y-auto`}>
    <p className="font-display text-xl font-bold text-gold-400 p-4 hidden md:block">OnlineShoppingDB</p><nav className="px-2 pb-4 space-y-0.5">{PAGES.map(([n, k]) => <button key={k} onClick={() => { setPg(k); setOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${pg === k ? "bg-gold-500 text-navy-950 font-semibold" : "hover:bg-white/10"}`}>{n}</button>)}</nav></aside>
    <div className="flex-1 min-w-0"><div className="bg-white border-b px-4 py-3 flex gap-2 items-center sticky top-0 z-10"><button className="btn-ghost md:hidden" onClick={() => setOpen(!open)}>Menu</button><b className="font-display">Admin dashboard</b>
      <div className="ml-auto flex gap-2"><button className="btn-ghost" onClick={() => setMode("shop")}>View store</button><button className="btn-gold" onClick={() => setMode("present")}>Presentation Mode</button></div></div>
      <main className="p-4 md:p-8 fade" key={pg}><Page /></main></div></div>;
}

