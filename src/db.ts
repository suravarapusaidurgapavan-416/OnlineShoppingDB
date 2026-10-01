import { useSyncExternalStore } from "react";
export type Row = Record<string, any>;
export const today = () => new Date().toISOString().slice(0, 10);
export const db: Record<string, Row[]> = {
  CATEGORY: [
    { Category_ID: 1, Category_Name: "Electronics", Description: "Devices and accessories" },
    { Category_ID: 2, Category_Name: "Fashion", Description: "Clothing and footwear" },
    { Category_ID: 3, Category_Name: "Home & Kitchen", Description: "Appliances and decor" },
    { Category_ID: 4, Category_Name: "Books", Description: "Textbooks and novels" }],
  CUSTOMER: [
    { Customer_ID: 101, Name: "Sai", Email: "sai@example.com", Phone: "9876543210", Address: "AP, India" },
    { Customer_ID: 102, Name: "Ananya", Email: "ananya@example.com", Phone: "9123456780", Address: "Hyderabad, India" },
    { Customer_ID: 103, Name: "Ravi", Email: "ravi@example.com", Phone: "9988776655", Address: "Chennai, India" }],
  PRODUCT: [
    { Product_ID: 201, Name: "Wireless Headphones", Price: 1499, Stock: 25, Category_ID: 1 },
    { Product_ID: 202, Name: "Smart Watch", Price: 2999, Stock: 15, Category_ID: 1 },
    { Product_ID: 203, Name: "Running Shoes", Price: 2499, Stock: 30, Category_ID: 2 },
    { Product_ID: 204, Name: "Denim Jacket", Price: 1899, Stock: 20, Category_ID: 2 },
    { Product_ID: 205, Name: "Air Fryer", Price: 4999, Stock: 10, Category_ID: 3 },
    { Product_ID: 206, Name: "Table Lamp", Price: 799, Stock: 40, Category_ID: 3 },
    { Product_ID: 207, Name: "DBMS Concepts Book", Price: 599, Stock: 50, Category_ID: 4 },
    { Product_ID: 208, Name: "Bluetooth Speaker", Price: 1999, Stock: 18, Category_ID: 1 }],
  CART: [],
  ORDERS: [
    { Order_ID: 301, Customer_ID: 101, Order_Date: "2026-10-05", Total_Amount: 1499, Status: "PLACED" },
    { Order_ID: 302, Customer_ID: 102, Order_Date: "2026-10-03", Total_Amount: 3098, Status: "DELIVERED" },
    { Order_ID: 303, Customer_ID: 103, Order_Date: "2026-10-04", Total_Amount: 2999, Status: "SHIPPED" }],
  ORDER_ITEM: [
    { Order_Item_ID: 1, Order_ID: 301, Product_ID: 201, Quantity: 1, Unit_Price: 1499 },
    { Order_Item_ID: 2, Order_ID: 302, Product_ID: 203, Quantity: 1, Unit_Price: 2499 },
    { Order_Item_ID: 3, Order_ID: 302, Product_ID: 207, Quantity: 1, Unit_Price: 599 },
    { Order_Item_ID: 4, Order_ID: 303, Product_ID: 202, Quantity: 1, Unit_Price: 2999 }],
  PAYMENT: [
    { Payment_ID: 401, Order_ID: 301, Amount: 1499, Method: "UPI", Status: "Pending" },
    { Payment_ID: 402, Order_ID: 302, Amount: 3098, Method: "Card", Status: "Paid" },
    { Payment_ID: 403, Order_ID: 303, Amount: 2999, Method: "COD", Status: "Pending" }],
  DELIVERY: [
    { Delivery_ID: 501, Order_ID: 301, Address: "AP, India", Tracking_No: "TRK301", Status: "Processing" },
    { Delivery_ID: 502, Order_ID: 302, Address: "Hyderabad, India", Tracking_No: "TRK302", Status: "Delivered" },
    { Delivery_ID: 503, Order_ID: 303, Address: "Chennai, India", Tracking_No: "TRK303", Status: "Shipped" }],
};
export const ICON: Record<number, string> = { 201: "🎧", 202: "⌚", 203: "👟", 204: "🧥", 205: "🍳", 206: "💡", 207: "📘", 208: "🔊" };
let ver = 0; const subs = new Set<() => void>();
export const notify = () => { ver++; subs.forEach(f => f()); };
export const useDb = () => useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => ver);
export const nextId = (t: string, k: string) => Math.max(0, ...db[t].map(r => r[k])) + 1;
export const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
export const cat = (id: number) => db.CATEGORY.find(c => c.Category_ID === id)?.Category_Name ?? "?";
export type Res = { ok: boolean; msg: string; sql: string };

export function validateProduct(p: Row, isNew: boolean): string | null {
  if (!p.Name || !String(p.Name).trim()) return "NOT NULL violated: Name is required.";
  if (!Number.isInteger(p.Product_ID) || p.Product_ID <= 0) return "Product_ID must be a positive integer.";
  if (isNew && db.PRODUCT.some(r => r.Product_ID === p.Product_ID)) return `Entity integrity: Product_ID ${p.Product_ID} already exists (PRIMARY KEY must be unique).`;
  if (!(p.Price > 0)) return "CHECK (Price > 0) failed.";
  if (!Number.isInteger(p.Stock) || p.Stock < 0) return "CHECK (Stock >= 0) failed.";
  if (!db.CATEGORY.some(c => c.Category_ID === p.Category_ID)) return `Referential integrity: Category_ID ${p.Category_ID} does not exist in CATEGORY.`;
  return null;
}
export function insertProduct(p: Row): Res {
  const sql = `INSERT INTO PRODUCT VALUES (${p.Product_ID}, '${p.Name}', ${p.Price}, ${p.Stock}, ${p.Category_ID});`;
  const e = validateProduct(p, true); if (e) return { ok: false, msg: "ERROR: " + e, sql };
  db.PRODUCT.push({ ...p }); notify(); return { ok: true, msg: "1 row inserted.", sql };
}
export function updateStock(id: number, stock: number): Res {
  const sql = `UPDATE PRODUCT SET Stock=${stock} WHERE Product_ID=${id};`;
  const r = db.PRODUCT.find(x => x.Product_ID === id);
  if (!r) return { ok: false, msg: "0 rows affected: Product_ID not found.", sql };
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, msg: "ERROR: CHECK (Stock >= 0) failed.", sql };
  r.Stock = stock; notify(); return { ok: true, msg: "1 row updated.", sql };
}
export function deleteProduct(id: number): Res {
  const sql = `DELETE FROM PRODUCT WHERE Product_ID=${id};`;
  if (!db.PRODUCT.some(x => x.Product_ID === id)) return { ok: false, msg: "0 rows affected: Product_ID not found.", sql };
  if (db.ORDER_ITEM.some(i => i.Product_ID === id)) return { ok: false, msg: "ERROR 1451: Cannot delete — referenced by ORDER_ITEM (Foreign Key constraint).", sql };
  db.PRODUCT = db.PRODUCT.filter(x => x.Product_ID !== id); notify(); return { ok: true, msg: "1 row deleted.", sql };
}
export function register(r: Row): string | null {
  if (!r.Name || !r.Email || !r.Address) return "NOT NULL violated: fill all fields.";
  if (db.CUSTOMER.some(c => c.Email === r.Email)) return "UNIQUE violated: Email already registered.";
  if (!/^\d{10}$/.test(r.Phone)) return "CHECK failed: Phone must be 10 digits.";
  db.CUSTOMER.push({ Customer_ID: nextId("CUSTOMER", "Customer_ID"), ...r }); notify(); return null;
}
export function ensureCart(cid: number) {
  if (!db.CART.some(c => c.Customer_ID === cid)) { db.CART.push({ Cart_ID: nextId("CART", "Cart_ID"), Customer_ID: cid, Created_Date: today() }); notify(); }
}
export function placeOrder(cid: number, items: { id: number; qty: number }[], method: string, address: string): Res & { orderId?: number } {
  for (const i of items) { const p = db.PRODUCT.find(x => x.Product_ID === i.id); if (!p || p.Stock < i.qty) return { ok: false, msg: `Out of stock: ${p?.Name ?? i.id}`, sql: "" }; }
  const total = items.reduce((s, i) => s + i.qty * db.PRODUCT.find(x => x.Product_ID === i.id)!.Price, 0);
  if (total <= 0) return { ok: false, msg: "Order total must be positive.", sql: "" };
  const oid = nextId("ORDERS", "Order_ID");
  db.ORDERS.push({ Order_ID: oid, Customer_ID: cid, Order_Date: today(), Total_Amount: total, Status: "PLACED" });
  items.forEach(i => { const p = db.PRODUCT.find(x => x.Product_ID === i.id)!; p.Stock -= i.qty;
    db.ORDER_ITEM.push({ Order_Item_ID: nextId("ORDER_ITEM", "Order_Item_ID"), Order_ID: oid, Product_ID: i.id, Quantity: i.qty, Unit_Price: p.Price }); });
  db.PAYMENT.push({ Payment_ID: nextId("PAYMENT", "Payment_ID"), Order_ID: oid, Amount: total, Method: method, Status: method === "COD" ? "Pending" : "Paid" });
  db.DELIVERY.push({ Delivery_ID: nextId("DELIVERY", "Delivery_ID"), Order_ID: oid, Address: address, Tracking_No: "TRK" + oid, Status: "Processing" });
  notify(); return { ok: true, msg: "Order placed", sql: "", orderId: oid };
}
export const orderSummary = () => db.ORDERS.map(o => ({ Order_ID: o.Order_ID, Customer_Name: db.CUSTOMER.find(c => c.Customer_ID === o.Customer_ID)?.Name, Order_Date: o.Order_Date, Total_Amount: o.Total_Amount, Status: o.Status }))
  .sort((a, b) => (a.Order_Date < b.Order_Date ? 1 : -1));
export const QUERIES: { name: string; sql: string; run: () => Row[] }[] = [
  { name: "JOIN", sql: "SELECT o.Order_ID, c.Name,\n o.Total_Amount, o.Status\nFROM ORDERS o\nJOIN CUSTOMER c\nON o.Customer_ID = c.Customer_ID;",
    run: () => db.ORDERS.map(o => ({ Order_ID: o.Order_ID, Name: db.CUSTOMER.find(c => c.Customer_ID === o.Customer_ID)?.Name, Total_Amount: o.Total_Amount, Status: o.Status })) },
  { name: "COUNT()", sql: "SELECT COUNT(*) AS Total_Orders FROM ORDERS;", run: () => [{ Total_Orders: db.ORDERS.length }] },
  { name: "SUM()", sql: "SELECT SUM(Amount) AS Total_Paid\nFROM PAYMENT WHERE Status='Paid';", run: () => [{ Total_Paid: db.PAYMENT.filter(p => p.Status === "Paid").reduce((s, p) => s + p.Amount, 0) }] },
  { name: "AVG()", sql: "SELECT AVG(Price) AS Avg_Price FROM PRODUCT;", run: () => [{ Avg_Price: +(db.PRODUCT.reduce((s, p) => s + p.Price, 0) / (db.PRODUCT.length || 1)).toFixed(2) }] },
  { name: "MIN()", sql: "SELECT MIN(Price) AS Cheapest FROM PRODUCT;", run: () => [{ Cheapest: Math.min(...db.PRODUCT.map(p => p.Price)) }] },
  { name: "MAX()", sql: "SELECT MAX(Price) AS Costliest FROM PRODUCT;", run: () => [{ Costliest: Math.max(...db.PRODUCT.map(p => p.Price)) }] },
  { name: "GROUP BY", sql: "SELECT c.Category_Name, COUNT(p.Product_ID) AS Products\nFROM CATEGORY c JOIN PRODUCT p\nON c.Category_ID = p.Category_ID\nGROUP BY c.Category_Name;",
    run: () => db.CATEGORY.map(c => ({ Category_Name: c.Category_Name, Products: db.PRODUCT.filter(p => p.Category_ID === c.Category_ID).length })).filter(r => r.Products > 0) },
  { name: "HAVING", sql: "SELECT Customer_ID, SUM(Total_Amount) AS Spent\nFROM ORDERS GROUP BY Customer_ID\nHAVING SUM(Total_Amount) > 2500;",
    run: () => { const m: Record<number, number> = {}; db.ORDERS.forEach(o => m[o.Customer_ID] = (m[o.Customer_ID] || 0) + o.Total_Amount); return Object.entries(m).filter(([, v]) => v > 2500).map(([k, v]) => ({ Customer_ID: +k, Spent: v })); } },
];
export const stats = () => ({
  customers: db.CUSTOMER.length, products: db.PRODUCT.length, orders: db.ORDERS.length,
  sales: db.PAYMENT.filter(p => p.Status === "Paid").reduce((s, p) => s + p.Amount, 0),
  pendingPay: db.PAYMENT.filter(p => p.Status === "Pending").length, pendingDel: db.DELIVERY.filter(d => d.Status !== "Delivered").length });
