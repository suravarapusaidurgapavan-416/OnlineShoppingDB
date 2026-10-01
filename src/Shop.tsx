import { useState } from "react";
import { db, useDb, ICON, fmt, cat, register, ensureCart, placeOrder, Row } from "./db";
import { Msg, Badge, H } from "./ui";

type Item = { id: number; qty: number };
export default function Shop({ uid, setUid }: { uid: number | null; setUid: (n: number | null) => void }) {
  useDb();
  const [page, setPage] = useState("home");
  const [sel, setSel] = useState<number>(201);
  const [cart, setCart] = useState<Item[]>([]);
  const [q, setQ] = useState(""); const [cf, setCf] = useState(0); const [sort, setSort] = useState("");
  const [method, setMethod] = useState("UPI"); const [addr, setAddr] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [last, setLast] = useState<number>(0);
  const [reg, setReg] = useState<Row>({ Name: "", Email: "", Phone: "", Address: "" });
  const user = db.CUSTOMER.find(c => c.Customer_ID === uid);

  const add = (id: number, go?: boolean) => {
    if (!uid) { setPage("login"); setMsg({ ok: false, t: "Please log in to add items to your cart." }); return; }
    const p = db.PRODUCT.find(x => x.Product_ID === id)!;
    const cur = cart.find(i => i.id === id)?.qty ?? 0;
    if (cur + 1 > p.Stock) { setMsg({ ok: false, t: `Only ${p.Stock} of ${p.Name} in stock.` }); return; }
    ensureCart(uid);
    setCart(cur ? cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) : [...cart, { id, qty: 1 }]);
    setMsg({ ok: true, t: `${p.Name} added to cart.` }); if (go) setPage("cart");
  };
  const total = cart.reduce((s, i) => s + i.qty * db.PRODUCT.find(p => p.Product_ID === i.id)!.Price, 0);
  let list = db.PRODUCT.filter(p => (!cf || p.Category_ID === cf) && (p.Name.toLowerCase().includes(q.toLowerCase()) || String(p.Product_ID).includes(q)));
  if (sort === "lo") list = [...list].sort((a, b) => a.Price - b.Price); if (sort === "hi") list = [...list].sort((a, b) => b.Price - a.Price);

  const Card = ({ p }: { p: Row }) => (
    <div className="card flex flex-col">
      <button onClick={() => { setSel(p.Product_ID); setPage("detail"); }} className="h-32 rounded-xl bg-gradient-to-br from-navy-100 to-white grid place-items-center text-6xl" aria-label={p.Name}>{ICON[p.Product_ID] ?? "📦"}</button>
      <p className="text-xs text-slate-500 mt-3">ID {p.Product_ID} · {cat(p.Category_ID)}</p>
      <h3 className="font-semibold">{p.Name}</h3>
      <p className="text-gold-600 font-bold">{fmt(p.Price)} <span className="text-xs text-slate-500 font-normal">{p.Stock > 0 ? `${p.Stock} in stock` : "Out of stock"}</span></p>
      <div className="flex gap-2 mt-3"><button disabled={!p.Stock} className="btn-ghost flex-1 disabled:opacity-40" onClick={() => add(p.Product_ID)}>Add to Cart</button>
        <button disabled={!p.Stock} className="btn-gold flex-1 disabled:opacity-40" onClick={() => add(p.Product_ID, true)}>Buy Now</button></div>
    </div>);

  const checkout = () => {
    if (!addr.trim()) { setMsg({ ok: false, t: "Delivery address is required (NOT NULL)." }); return; }
    const r = placeOrder(uid!, cart, method, addr);
    if (!r.ok) { setMsg({ ok: false, t: r.msg }); return; }
    setLast(r.orderId!); setCart([]); setMsg(null); setPage("done");
  };
  const nav = ["home", "products", "cart", "orders", "profile"];

  return (<div className="min-h-screen">
    <header className="bg-navy-900 text-white sticky top-0 z-10"><div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
      <button onClick={() => setPage("home")} className="font-display text-xl font-bold text-gold-400">Aurum Store</button>
      <nav className="flex gap-1 flex-wrap text-sm">{nav.map(n => <button key={n} onClick={() => setPage(n)} className={`px-3 py-1.5 rounded-lg capitalize ${page === n ? "bg-white/15" : "hover:bg-white/10"}`}>{n === "cart" ? `cart (${cart.reduce((s, i) => s + i.qty, 0)})` : n === "orders" ? "my orders" : n}</button>)}</nav>
      <div className="ml-auto text-sm">{user ? <><span className="mr-3">Hi, {user.Name}</span><button className="btn-ghost !py-1" onClick={() => { setUid(null); setCart([]); setPage("home"); }}>Log out</button></> : <button className="btn-gold !py-1" onClick={() => setPage("login")}>Login / Register</button>}</div>
    </div></header>
    <main className="max-w-6xl mx-auto px-4 py-6 fade" key={page}>
      {msg && page !== "done" && <div className="mb-4"><Msg ok={msg.ok}>{msg.t}</Msg></div>}

      {page === "home" && <>
        <section className="rounded-3xl bg-navy-900 text-white p-8 md:p-12 mb-8"><h1 className="font-display text-3xl md:text-5xl font-bold max-w-xl">Quality products, delivered to your door.</h1>
          <p className="mt-3 text-white/70 max-w-lg">Browse {db.PRODUCT.length} products across {db.CATEGORY.length} categories. Every order is stored in the OnlineShoppingDB tables.</p>
          <button className="btn-gold mt-6" onClick={() => setPage("products")}>Shop now</button></section>
        <H t="Categories" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">{db.CATEGORY.map(c => <button key={c.Category_ID} onClick={() => { setCf(c.Category_ID); setPage("products"); }} className="card text-left hover:border-gold-500"><p className="font-semibold">{c.Category_Name}</p><p className="text-xs text-slate-500">{c.Description}</p></button>)}</div>
        <H t="Featured products" /><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{db.PRODUCT.slice(0, 4).map(p => <Card key={p.Product_ID} p={p} />)}</div></>}

      {page === "products" && <>
        <H t="Products" s="Search by name or Product ID, filter by category and sort by price." />
        <div className="grid md:grid-cols-3 gap-3 mb-5"><input className="inp" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
          <select className="inp" value={cf} onChange={e => setCf(+e.target.value)} aria-label="Category"><option value={0}>All categories</option>{db.CATEGORY.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name}</option>)}</select>
          <select className="inp" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option value="">Sort: default</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option></select></div>
        {list.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map(p => <Card key={p.Product_ID} p={p} />)}</div> : <p className="card text-slate-600">No products match. Clear the search or choose another category.</p>}</>}

      {page === "detail" && (() => { const p = db.PRODUCT.find(x => x.Product_ID === sel); return !p ? <p>Product not found.</p> :
        <div className="card grid md:grid-cols-2 gap-8"><div className="h-64 rounded-2xl bg-gradient-to-br from-navy-100 to-white grid place-items-center text-9xl">{ICON[p.Product_ID] ?? "📦"}</div>
          <div><p className="text-sm text-slate-500">{cat(p.Category_ID)} · Product ID {p.Product_ID}</p><h1 className="font-display text-3xl font-bold mt-1">{p.Name}</h1>
            <p className="text-2xl text-gold-600 font-bold mt-3">{fmt(p.Price)}</p><p className="mt-2 text-sm">{p.Stock > 0 ? `${p.Stock} units in stock` : "Currently out of stock"}</p>
            <div className="flex gap-2 mt-6"><button disabled={!p.Stock} className="btn-ghost disabled:opacity-40" onClick={() => add(p.Product_ID)}>Add to Cart</button><button disabled={!p.Stock} className="btn-gold disabled:opacity-40" onClick={() => add(p.Product_ID, true)}>Buy Now</button></div></div></div>; })()}

      {page === "login" && <div className="grid md:grid-cols-2 gap-6">
        <div className="card"><H t="Login" s="Choose an existing customer from the CUSTOMER table." />
          <div className="space-y-2">{db.CUSTOMER.map(c => <button key={c.Customer_ID} className="btn-ghost w-full !justify-between" onClick={() => { setUid(c.Customer_ID); setAddr(c.Address); setMsg(null); setPage("home"); }}><span>{c.Name} · {c.Email}</span><span className="text-slate-500">ID {c.Customer_ID}</span></button>)}</div></div>
        <div className="card"><H t="Register" s="Creates a new row in CUSTOMER." />
          <div className="space-y-2">{["Name", "Email", "Phone", "Address"].map(k => <input key={k} className="inp" placeholder={k} value={reg[k]} onChange={e => setReg({ ...reg, [k]: e.target.value })} aria-label={k} />)}
            <button className="btn-gold w-full" onClick={() => { const e = register(reg); if (e) setMsg({ ok: false, t: e }); else { const c = db.CUSTOMER[db.CUSTOMER.length - 1]; setUid(c.Customer_ID); setAddr(c.Address); setMsg(null); setPage("home"); } }}>Create account</button></div></div></div>}

      {page === "cart" && <><H t="Shopping cart" />{cart.length === 0 ? <div className="card">Your cart is empty. <button className="underline" onClick={() => setPage("products")}>Browse products</button></div> :
        <div className="grid md:grid-cols-3 gap-6"><div className="md:col-span-2 space-y-3">{cart.map(i => { const p = db.PRODUCT.find(x => x.Product_ID === i.id)!; return (
          <div key={i.id} className="card flex items-center gap-4"><span className="text-4xl">{ICON[i.id]}</span><div className="flex-1"><p className="font-semibold">{p.Name}</p><p className="text-sm text-slate-500">{fmt(p.Price)} each</p></div>
            <input type="number" min={1} max={p.Stock} className="inp !w-20" value={i.qty} aria-label="Quantity" onChange={e => { const n = Math.min(p.Stock, Math.max(1, +e.target.value || 1)); setCart(cart.map(x => x.id === i.id ? { ...x, qty: n } : x)); }} />
            <button className="btn-ghost" onClick={() => setCart(cart.filter(x => x.id !== i.id))}>Remove</button></div>); })}</div>
          <div className="card h-fit"><p className="text-sm text-slate-500">Order total</p><p className="text-3xl font-bold text-gold-600">{fmt(total)}</p><button className="btn-navy w-full mt-4" onClick={() => setPage("checkout")}>Proceed to checkout</button></div></div>}</>}

      {page === "checkout" && (!uid ? <p>Please log in first.</p> : <div className="grid md:grid-cols-2 gap-6">
        <div className="card"><H t="Checkout" s="Delivery address is saved in the DELIVERY table." /><label className="text-sm font-medium">Delivery address</label>
          <textarea className="inp mt-1" rows={3} value={addr} onChange={e => setAddr(e.target.value)} />
          <p className="text-sm font-medium mt-4 mb-2">Payment method</p><div className="grid grid-cols-3 gap-2">{["UPI", "Card", "COD"].map(m => <button key={m} onClick={() => setMethod(m)} className={`btn ${method === m ? "bg-navy-900 text-white" : "btn-ghost"}`}>{m}</button>)}</div>
          <p className="text-xs text-slate-500 mt-2">Simulated payment — UPI and Card are marked Paid, COD stays Pending.</p></div>
        <div className="card"><p className="font-semibold mb-2">Summary</p>{cart.map(i => <p key={i.id} className="text-sm flex justify-between"><span>{db.PRODUCT.find(p => p.Product_ID === i.id)!.Name} × {i.qty}</span></p>)}
          <p className="text-3xl font-bold text-gold-600 my-4">{fmt(total)}</p><button disabled={!cart.length} className="btn-gold w-full disabled:opacity-40" onClick={checkout}>Pay and place order</button></div></div>)}

      {page === "done" && <div className="card text-center max-w-lg mx-auto"><div className="text-5xl">✅</div><h1 className="font-display text-2xl font-bold mt-2">Order confirmed</h1>
        <p className="mt-2 text-slate-600">Order ID <b>{last}</b> · Tracking <b>TRK{last}</b></p><div className="flex gap-2 justify-center mt-5"><button className="btn-navy" onClick={() => setPage("orders")}>Track order</button><button className="btn-ghost" onClick={() => setPage("products")}>Keep shopping</button></div></div>}

      {page === "orders" && (!uid ? <p className="card">Log in to see your orders.</p> : <><H t="My orders" />
        {db.ORDERS.filter(o => o.Customer_ID === uid).length === 0 && <p className="card text-slate-600">No orders yet.</p>}
        <div className="space-y-4">{db.ORDERS.filter(o => o.Customer_ID === uid).reverse().map(o => { const d = db.DELIVERY.find(x => x.Order_ID === o.Order_ID); const pay = db.PAYMENT.find(x => x.Order_ID === o.Order_ID); const steps = ["Processing", "Shipped", "Delivered"]; const at = steps.indexOf(d?.Status);
          return <div key={o.Order_ID} className="card"><div className="flex flex-wrap gap-3 items-center"><b>Order #{o.Order_ID}</b><span className="text-sm text-slate-500">{o.Order_Date}</span><Badge s={o.Status} /><span className="ml-auto font-bold text-gold-600">{fmt(o.Total_Amount)}</span></div>
            <p className="text-sm mt-2">{db.ORDER_ITEM.filter(i => i.Order_ID === o.Order_ID).map(i => `${db.PRODUCT.find(p => p.Product_ID === i.Product_ID)?.Name ?? "Item"} × ${i.Quantity}`).join(", ")}</p>
            <p className="text-sm text-slate-500 mt-1">Payment: {pay?.Method} <Badge s={pay?.Status} /> · Tracking {d?.Tracking_No}</p>
            <div className="flex mt-4">{steps.map((s, i) => <div key={s} className="flex-1 text-center"><div className={`h-2 ${i <= at ? "bg-gold-500" : "bg-slate-200"} ${i === 0 ? "rounded-l-full" : ""} ${i === 2 ? "rounded-r-full" : ""}`} /><p className={`text-xs mt-1 ${i <= at ? "font-semibold" : "text-slate-400"}`}>{s}</p></div>)}</div></div>; })}</div></>)}

      {page === "profile" && (!user ? <p className="card">Log in to see your profile.</p> : <div className="card max-w-lg"><H t="My profile" />{Object.entries(user).map(([k, v]) => <p key={k} className="flex justify-between border-b border-slate-100 py-2 text-sm"><span className="text-slate-500">{k}</span><b>{String(v)}</b></p>)}</div>)}
    </main></div>);
}
