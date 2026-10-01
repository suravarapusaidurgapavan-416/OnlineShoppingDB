import { useState } from "react";
import { db, useDb, fmt, stats, QUERIES, orderSummary, insertProduct, updateStock, deleteProduct, notify, Res, Row } from "./db";
import { Table, Sql, Msg, H, Badge } from "./ui";
import schemaSql from "../database/schema.sql?raw";

const Bars = ({ title, data }: { title: string; data: [string, number][] }) => { const m = Math.max(1, ...data.map(d => d[1]));
  return <div className="card"><p className="font-semibold mb-3">{title}</p><div className="space-y-2">{data.map(([k, v]) => <div key={k} className="flex items-center gap-2 text-xs"><span className="w-24 truncate">{k}</span>
    <div className="flex-1 bg-slate-100 rounded-full h-3"><div className="h-3 rounded-full bg-gradient-to-r from-navy-800 to-gold-500 transition-all" style={{ width: `${(v / m) * 100}%` }} /></div><b className="w-14 text-right">{v.toLocaleString("en-IN")}</b></div>)}</div></div>; };
const count = (t: string, k: string) => { const m: Record<string, number> = {}; db[t].forEach(r => m[r[k]] = (m[r[k]] || 0) + 1); return Object.entries(m) as [string, number][]; };

export const Dashboard = () => { useDb(); const s = stats();
  const K: [string, string][] = [["Total Customers", s.customers + ""], ["Total Products", s.products + ""], ["Total Orders", s.orders + ""], ["Total Sales", fmt(s.sales)], ["Pending Payments", s.pendingPay + ""], ["Pending Deliveries", s.pendingDel + ""]];
  const sales: Record<string, number> = {}; db.ORDERS.forEach(o => sales[o.Order_Date] = (sales[o.Order_Date] || 0) + o.Total_Amount);
  return <><H t="Dashboard" s="Live figures calculated from the database tables." />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">{K.map(([k, v]) => <div key={k} className="card border-l-4 !border-l-gold-500"><p className="text-xs text-slate-500">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>
    <div className="grid md:grid-cols-2 gap-4"><Bars title="Sales by date (₹)" data={Object.entries(sales).sort()} /><Bars title="Orders by status" data={count("ORDERS", "Status")} />
      <Bars title="Products by category" data={db.CATEGORY.map(c => [c.Category_Name, db.PRODUCT.filter(p => p.Category_ID === c.Category_ID).length] as [string, number])} /><Bars title="Payment status" data={count("PAYMENT", "Status")} /></div></>; };

const STATUS: Record<string, [string, string[]]> = { ORDERS: ["Order_ID", ["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"]], PAYMENT: ["Payment_ID", ["Pending", "Paid", "Failed"]], DELIVERY: ["Delivery_ID", ["Processing", "Shipped", "Delivered"]] };
export const TableView = ({ t }: { t: string }) => { useDb(); const [id, setId] = useState(""); const [st, setSt] = useState(""); const [m, setM] = useState<Res | null>(null); const cfg = STATUS[t]; const pk = Object.keys(db[t][0] ?? { id: 1 })[0];
  const upd = () => { const r = db[t].find(x => String(x[cfg[0]]) === id); if (!r) return setM({ ok: false, msg: `No row with ${cfg[0]} = ${id}.`, sql: "" }); if (!cfg[1].includes(st)) return setM({ ok: false, msg: "CHECK failed: choose a valid status.", sql: "" });
    r.Status = st; notify(); setM({ ok: true, msg: "1 row updated.", sql: `UPDATE ${t} SET Status='${st}' WHERE ${cfg[0]}=${id};` }); };
  return <><H t={t} s={`${db[t].length} rows · primary key: ${pk}`} /><Table rows={db[t]} />
    {cfg && <div className="card mt-4"><p className="font-semibold mb-2">Update status</p><div className="flex flex-wrap gap-2"><input className="inp !w-40" placeholder={cfg[0]} value={id} onChange={e => setId(e.target.value)} />
      <select className="inp !w-40" value={st} onChange={e => setSt(e.target.value)}><option value="">Status…</option>{cfg[1].map(s => <option key={s}>{s}</option>)}</select><button className="btn-gold" onClick={upd}>Update</button></div>
      {m && <div className="mt-3 space-y-2">{m.sql && <Sql>{m.sql}</Sql>}<Msg ok={m.ok}>{m.msg}</Msg></div>}</div>}</>; };

export const Crud = () => { useDb(); const [f, setF] = useState<Row>({ id: "209", name: "Gaming Mouse", price: "999", stock: "30", cat: "1" }); const [uid, setUid] = useState("201"); const [us, setUs] = useState("20"); const [did, setDid] = useState("201"); const [m, setM] = useState<Res | null>(null); const [show, setShow] = useState(true);
  return <><H t="CRUD operations" s="Each button runs a real operation on the PRODUCT table. Constraint violations show the same errors MySQL would raise." />
    <div className="grid md:grid-cols-2 gap-4"><div className="card space-y-2"><p className="font-semibold">Create — INSERT</p><div className="grid grid-cols-2 gap-2">{[["id", "Product_ID"], ["name", "Name"], ["price", "Price"], ["stock", "Stock"], ["cat", "Category_ID"]].map(([k, l]) => <input key={k} className="inp" placeholder={l} aria-label={l} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />)}</div>
      <button className="btn-gold" onClick={() => { setShow(false); setM(insertProduct({ Product_ID: +f.id, Name: f.name, Price: +f.price, Stock: +f.stock, Category_ID: +f.cat })); }}>Insert row</button></div>
      <div className="card space-y-2"><p className="font-semibold">Update — UPDATE</p><div className="flex gap-2"><input className="inp" aria-label="Product_ID" placeholder="Product_ID" value={uid} onChange={e => setUid(e.target.value)} /><input className="inp" aria-label="Stock" placeholder="New stock" value={us} onChange={e => setUs(e.target.value)} /></div>
        <button className="btn-gold" onClick={() => { setShow(false); setM(updateStock(+uid, us === "" ? NaN : +us)); }}>Update stock</button></div>
      <div className="card space-y-2"><p className="font-semibold">Delete — DELETE</p><input className="inp" aria-label="Product_ID" placeholder="Product_ID" value={did} onChange={e => setDid(e.target.value)} /><button className="btn-navy" onClick={() => { setShow(false); setM(deleteProduct(+did)); }}>Delete row</button></div>
      <div className="card space-y-2"><p className="font-semibold">Read — SELECT</p><Sql>SELECT * FROM PRODUCT;</Sql><button className="btn-ghost" onClick={() => { setShow(true); setM({ ok: true, msg: `${db.PRODUCT.length} rows in set.`, sql: "SELECT * FROM PRODUCT;" }); }}>Run SELECT</button></div></div>
    {m && <div className="mt-4 space-y-2"><Sql>{m.sql}</Sql><Msg ok={m.ok}>{m.msg}</Msg></div>}<div className="mt-4"><Table rows={db.PRODUCT} /></div></>; };

const OPS: [string, string, [string, string][]][] = [
  ["DDL", "Data Definition Language manages database structure.", [["CREATE", "CREATE TABLE CATEGORY (Category_ID INT PRIMARY KEY, Category_Name VARCHAR(50) NOT NULL);"], ["ALTER", "ALTER TABLE PRODUCT ADD COLUMN Brand VARCHAR(40);"], ["DROP", "DROP TABLE CART;"], ["TRUNCATE", "TRUNCATE TABLE CART;"]]],
  ["DML", "Data Manipulation Language manages data.", [["INSERT", "INSERT INTO PRODUCT VALUES (209,'Gaming Mouse',999,30,1);"], ["UPDATE", "UPDATE PRODUCT SET Stock=20 WHERE Product_ID=201;"], ["DELETE", "DELETE FROM PRODUCT WHERE Product_ID=209;"]]],
  ["DQL", "Data Query Language retrieves data.", [["SELECT", "SELECT * FROM PRODUCT;"], ["WHERE", "SELECT Name, Price FROM PRODUCT WHERE Price > 1500;"], ["ORDER BY", "SELECT Name, Price FROM PRODUCT ORDER BY Price DESC;"], ["GROUP BY", "SELECT Category_ID, COUNT(*) FROM PRODUCT GROUP BY Category_ID;"], ["HAVING", "SELECT Category_ID, COUNT(*) FROM PRODUCT GROUP BY Category_ID HAVING COUNT(*) > 2;"]]]];
export const SqlOps = () => { useDb(); return <><H t="SQL operations" s="DDL = structure · DML = data · DQL = retrieval." />
  <div className="space-y-4">{OPS.map(([n, d, ex]) => <div key={n} className="card"><p className="font-display text-xl font-bold">{n}</p><p className="text-sm text-slate-600 mb-3">{d}</p><div className="grid md:grid-cols-2 gap-3">{ex.map(([k, s]) => <div key={k}><p className="text-sm font-semibold mb-1">{k}</p><Sql>{s}</Sql></div>)}</div></div>)}</div>
  <div className="grid md:grid-cols-2 gap-4 mt-4"><div><p className="font-semibold mb-2">Result: WHERE Price &gt; 1500</p><Table rows={db.PRODUCT.filter(p => p.Price > 1500).map(p => ({ Name: p.Name, Price: p.Price }))} /></div>
    <div><p className="font-semibold mb-2">Result: ORDER BY Price DESC</p><Table rows={[...db.PRODUCT].sort((a, b) => b.Price - a.Price).map(p => ({ Name: p.Name, Price: p.Price }))} /></div></div></>; };

export const Advanced = ({ only }: { only?: string[] }) => { useDb(); const [sel, setSel] = useState("JOIN"); const list = QUERIES.filter(q => !only || only.includes(q.name)); const q = list.find(x => x.name === sel) ?? list[0];
  return <><H t="Advanced queries" s="Pick a query to see its SQL and live result." /><div className="flex flex-wrap gap-2 mb-4">{list.map(x => <button key={x.name} onClick={() => setSel(x.name)} className={`btn ${q.name === x.name ? "bg-navy-900 text-white" : "btn-ghost"}`}>{x.name}</button>)}</div>
    <Sql>{q.sql}</Sql><div className="mt-3"><Table rows={q.run()} /></div></>; };

export const Views = () => { useDb(); return <><H t="Database view" s="A view is a saved query that behaves like a virtual table." />
  <Sql>{`CREATE VIEW OrderSummary AS\nSELECT o.Order_ID, c.Name AS Customer_Name,\n o.Order_Date, o.Total_Amount, o.Status\nFROM ORDERS o JOIN CUSTOMER c\nON o.Customer_ID = c.Customer_ID;`}</Sql><div className="my-3" />
  <Sql>{"SELECT * FROM OrderSummary\nORDER BY Order_Date DESC;"}</Sql><div className="mt-3"><Table rows={orderSummary()} /></div></>; };

export const Integrity = () => { useDb(); const [log, setLog] = useState<Res[]>([]);
  const T: [string, () => Res][] = [["Duplicate Product_ID 201", () => insertProduct({ Product_ID: 201, Name: "Copy", Price: 10, Stock: 1, Category_ID: 1 })], ["Unknown Category_ID 99", () => insertProduct({ Product_ID: 250, Name: "Ghost", Price: 10, Stock: 1, Category_ID: 99 })],
    ["Negative stock", () => insertProduct({ Product_ID: 251, Name: "Bad stock", Price: 10, Stock: -5, Category_ID: 1 })], ["Price = 0", () => insertProduct({ Product_ID: 252, Name: "Free", Price: 0, Stock: 1, Category_ID: 1 })],
    ["Delete ordered product 201", () => deleteProduct(201)], ["Valid insert (Product 260)", () => insertProduct({ Product_ID: 260, Name: "USB Cable", Price: 299, Stock: 100, Category_ID: 1 })]];
  const C: [string, string][] = [["Entity integrity", "Every table has a unique, non-null PRIMARY KEY."], ["Referential integrity", "A FOREIGN KEY must point to an existing parent record."], ["Domain validation", "NOT NULL, UNIQUE and CHECK keep values valid (Stock ≥ 0, Total > 0, Payment: Pending/Paid/Failed, Delivery: Processing/Shipped/Delivered)."]];
  return <><H t="Data integrity" s="Run each test and watch the database accept or reject it." /><div className="grid md:grid-cols-3 gap-3 mb-5">{C.map(([a, b]) => <div key={a} className="card"><p className="font-semibold">{a}</p><p className="text-sm text-slate-600 mt-1">{b}</p></div>)}</div>
    <div className="flex flex-wrap gap-2 mb-4">{T.map(([n, f]) => <button key={n} className="btn-ghost" onClick={() => setLog([f(), ...log].slice(0, 5))}>{n}</button>)}</div>
    <div className="space-y-2">{log.map((r, i) => <div key={i}><Sql>{r.sql}</Sql><div className="mt-1" /><Msg ok={r.ok}>{r.msg}</Msg></div>)}</div></>; };

const COLS: Record<string, [string, string][]> = { CATEGORY: [["Category_ID", "PK"], ["Category_Name", ""], ["Description", ""]], PRODUCT: [["Product_ID", "PK"], ["Name", ""], ["Price", ""], ["Stock", ""], ["Category_ID", "FK"]],
  ORDER_ITEM: [["Order_Item_ID", "PK"], ["Order_ID", "FK"], ["Product_ID", "FK"], ["Quantity", ""], ["Unit_Price", ""]], CUSTOMER: [["Customer_ID", "PK"], ["Name", ""], ["Email", ""], ["Phone", ""], ["Address", ""]],
  ORDERS: [["Order_ID", "PK"], ["Customer_ID", "FK"], ["Order_Date", ""], ["Total_Amount", ""], ["Status", ""]], PAYMENT: [["Payment_ID", "PK"], ["Order_ID", "FK"], ["Amount", ""], ["Method", ""], ["Status", ""]],
  CART: [["Cart_ID", "PK"], ["Customer_ID", "FK"], ["Created_Date", ""]], DELIVERY: [["Delivery_ID", "PK"], ["Order_ID", "FK"], ["Address", ""], ["Tracking_No", ""], ["Status", ""]] };
const POS: Record<string, [number, number]> = { CATEGORY: [20, 20], PRODUCT: [300, 20], ORDER_ITEM: [580, 20], CUSTOMER: [20, 250], ORDERS: [300, 250], PAYMENT: [580, 250], CART: [20, 470], DELIVERY: [580, 470] };
const REL: [string, string][] = [["CATEGORY", "PRODUCT"], ["PRODUCT", "ORDER_ITEM"], ["CUSTOMER", "CART"], ["CUSTOMER", "ORDERS"], ["ORDERS", "ORDER_ITEM"], ["ORDERS", "PAYMENT"], ["ORDERS", "DELIVERY"]];
export const ER = () => { const [sel, setSel] = useState<string | null>(null); const ctr = (t: string) => [POS[t][0] + 100, POS[t][1] + (28 + COLS[t].length * 20) / 2];
  return <><H t="ER diagram" s="Click a table to highlight its relationships. PK = Primary Key, FK = Foreign Key. Each line is one-to-many (1 → N)." />
    <div className="card !p-2 overflow-x-auto"><svg viewBox="0 0 800 620" className="min-w-[720px] w-full" role="img" aria-label="Entity relationship diagram">
      {REL.map(([a, b]) => { const [x1, y1] = ctr(a), [x2, y2] = ctr(b), on = sel === a || sel === b; return <g key={a + b}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#C9A227" : "#94a3b8"} strokeWidth={on ? 3 : 1.5} />
        <text x={x1 + (x2 - x1) * 0.25} y={y1 + (y2 - y1) * 0.25 - 4} fontSize="11" fill="#12305A" fontWeight="700">1</text><text x={x1 + (x2 - x1) * 0.75} y={y1 + (y2 - y1) * 0.75 - 4} fontSize="11" fill="#12305A" fontWeight="700">N</text></g>; })}
      {Object.entries(COLS).map(([t, cs]) => { const [x, y] = POS[t]; const on = sel === t || REL.some(([a, b]) => (a === sel && b === t) || (b === sel && a === t));
        return <g key={t} onClick={() => setSel(sel === t ? null : t)} className="cursor-pointer"><rect x={x} y={y} width="200" height={28 + cs.length * 20} rx="10" fill="#fff" stroke={on ? "#C9A227" : "#12305A"} strokeWidth={on ? 3 : 1.5} />
          <rect x={x} y={y} width="200" height="28" rx="10" fill="#0B1F3A" /><rect x={x} y={y + 18} width="200" height="10" fill="#0B1F3A" /><text x={x + 100} y={y + 19} textAnchor="middle" fill="#E0B84C" fontSize="13" fontWeight="700">{t}</text>
          {cs.map(([c, k], i) => <g key={c}><text x={x + 10} y={y + 28 + 15 + i * 20} fontSize="12" fill="#0B1F3A">{c}</text>{k && <text x={x + 190} y={y + 28 + 15 + i * 20} textAnchor="end" fontSize="11" fontWeight="700" fill={k === "PK" ? "#A8861C" : "#1C437A"}>{k}</text>}</g>)}</g>; })}
    </svg></div></>; };

export const Evidence = () => { useDb(); const [imgs, setImgs] = useState<string[]>([]);
  const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="card space-y-3"><p className="font-display text-lg font-bold">{t}</p>{children}</section>;
  return <><H t="Project evidence" s="Everything needed for the report and viva, in one place." /><div className="space-y-4">
    <Sec t="ER diagram"><ER /></Sec>
    <Sec t="Relational schema"><Sql>{Object.entries(COLS).map(([t, c]) => `${t}(${c.map(([n, k]) => k === "PK" ? `<u>${n}</u>` : k === "FK" ? `${n}*` : n).join(", ")})`).join("\n").replace(/<u>|<\/u>/g, "")}</Sql><p className="text-xs text-slate-500">Primary key is the first attribute of each relation; * marks a foreign key.</p></Sec>
    <Sec t="SQL script (MySQL — OnlineShoppingDB)"><div className="max-h-96 overflow-auto rounded-xl"><Sql>{schemaSql}</Sql></div></Sec>
    <Sec t="Constraints"><Table rows={[{ Type: "PRIMARY KEY", Applied_On: "Every table's ID column" }, { Type: "FOREIGN KEY", Applied_On: "PRODUCT, CART, ORDERS, ORDER_ITEM, PAYMENT, DELIVERY" }, { Type: "NOT NULL", Applied_On: "Name, Email, Address, Price, Stock …" }, { Type: "UNIQUE", Applied_On: "Email, Category_Name, Tracking_No" }, { Type: "CHECK", Applied_On: "Price>0, Stock>=0, Total>0, Status lists" }]} /></Sec>
    <Sec t="Sample data">{Object.keys(db).map(t => <div key={t}><p className="text-sm font-semibold mb-1">{t}</p><Table rows={db[t]} /></div>)}</Sec>
    <Sec t="Query list, JOIN and aggregate results">{QUERIES.map(q => <div key={q.name}><p className="text-sm font-semibold mb-1">{q.name}</p><Sql>{q.sql}</Sql><div className="mt-2"><Table rows={q.run()} /></div></div>)}</Sec>
    <Sec t="View result"><Table rows={orderSummary()} /></Sec>
    <Sec t="Screenshots"><input type="file" accept="image/*" multiple aria-label="Upload screenshots" className="text-sm" onChange={e => setImgs([...imgs, ...Array.from(e.target.files ?? []).map(f => URL.createObjectURL(f))])} />
      {imgs.length === 0 ? <p className="text-sm text-slate-500">Add your INSERT / SELECT / JOIN screenshots here to show them during the demo.</p> : <div className="grid sm:grid-cols-2 gap-3">{imgs.map(s => <img key={s} src={s} alt="Evidence screenshot" className="rounded-xl border" />)}</div>}</Sec>
  </div></>; };

export const PAGES: [string, string, () => JSX.Element][] = [["Dashboard", "dash", Dashboard], ...["CATEGORY", "PRODUCT", "CUSTOMER", "CART", "ORDERS", "ORDER_ITEM", "PAYMENT", "DELIVERY"].map(t => [t === "ORDER_ITEM" ? "Order Items" : t[0] + t.slice(1).toLowerCase(), t, () => <TableView t={t} />] as [string, string, () => JSX.Element]),
  ["SQL Operations", "sql", SqlOps], ["CRUD Operations", "crud", Crud], ["Advanced Queries", "adv", Advanced], ["Database Views", "view", Views], ["Data Integrity", "int", Integrity], ["ER Diagram", "er", ER], ["Evidence / Reports", "ev", Evidence]];
