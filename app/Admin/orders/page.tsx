"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  address: string;
  city: string | null;
  state: string;
};

type OrderItem = {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  status: string;
  subtotal: number | null;
  delivery_fee: number | null;
  total: number;
  created_at: string;
  customers: Customer | null;
  order_items: OrderItem[];
};

function money(amount: number | null | undefined) {
  return `â‚¦${((amount ?? 0) / 100).toLocaleString()}`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authed) return;

    async function fetchOrders() {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          subtotal,
          delivery_fee,
          total,
          created_at,
          customers ( id, name, email, phone, whatsapp, address, city, state ),
          order_items ( id, name, size, quantity, price )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        alert("Failed to load orders: " + error.message);
      } else {
        const parsedOrders = (data ?? []).map((order: any) => ({
          ...order,
          customers: Array.isArray(order.customers)
            ? order.customers[0] ?? null
            : order.customers ?? null,
        })) as Order[];
        setOrders(parsedOrders);
      }

      setLoading(false);
    }

    fetchOrders();
  }, [authed]);

  const customerInventory = useMemo(() => {
    const summaries = new Map<
      string,
      {
        customer: Customer;
        orderCount: number;
        itemCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    >();

    orders.forEach((order) => {
      if (!order.customers) return;
      const key = order.customers.email || order.customers.phone || order.customers.id;
      const existing = summaries.get(key);
      const itemCount = order.order_items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );

      if (existing) {
        existing.orderCount += 1;
        existing.itemCount += itemCount;
        existing.totalSpent += order.total ?? 0;
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
      } else {
        summaries.set(key, {
          customer: order.customers,
          orderCount: 1,
          itemCount,
          totalSpent: order.total ?? 0,
          lastOrderDate: order.created_at,
        });
      }
    });

    return Array.from(summaries.values()).sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }, [orders]);

  const totalItemsOrdered = orders.reduce(
    (sum, order) =>
      sum +
      order.order_items.reduce(
        (orderSum, item) => orderSum + (Number(item.quantity) || 0),
        0
      ),
    0
  );
  const totalOrderValue = orders.reduce((sum, order) => sum + (order.total ?? 0), 0);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      alert("Wrong password!");
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-200 text-slate-900 flex items-center justify-center px-4 font-titillium">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-semibold tracking-[0.3em] text-sm uppercase mb-2">LOIS TECH</h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase">Admin Orders</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-white border border-slate-300 text-slate-900 text-sm px-4 py-3 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200 transition-colors placeholder-slate-400"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-slate-900 text-white text-xs tracking-[0.25em] uppercase font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-titillium">
      <nav className="sticky top-0 z-50 bg-slate-200/80 backdrop-blur-xl border-b border-slate-300/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold tracking-[0.3em] text-sm uppercase">LOIS TECH Admin</h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase mt-1">Orders by Customer</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/Admin")} className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">Add Product</button>
            <button onClick={() => router.push("/Admin/edit")} className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">Edit Products</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 pb-24 space-y-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Customers</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{customerInventory.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Orders</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Items</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{totalItemsOrdered}</p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Value</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{money(totalOrderValue)}</p>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-4">
                Customer Inventory
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Customer</th>
                      <th className="py-3 pr-4 font-medium">Contact</th>
                      <th className="py-3 pr-4 font-medium">Orders</th>
                      <th className="py-3 pr-4 font-medium">Items</th>
                      <th className="py-3 pr-4 font-medium">Spent</th>
                      <th className="py-3 font-medium">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerInventory.map((entry) => (
                      <tr key={entry.customer.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{entry.customer.name}</p>
                          <p className="text-xs text-slate-500">{entry.customer.state}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-600">
                          <p>{entry.customer.email}</p>
                          <p>{entry.customer.whatsapp || entry.customer.phone}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{entry.orderCount}</td>
                        <td className="py-3 pr-4 text-slate-700">{entry.itemCount}</td>
                        <td className="py-3 pr-4 font-semibold text-slate-900">{money(entry.totalSpent)}</td>
                        <td className="py-3 text-xs text-slate-500">
                          {new Date(entry.lastOrderDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Order Log</p>
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-slate-900">{order.customers?.name}</p>
                      <p className="text-xs text-slate-500">{order.customers?.email} â€¢ {order.customers?.phone}</p>
                      {order.customers?.whatsapp && (
                        <p className="text-xs text-slate-500">WhatsApp: {order.customers.whatsapp}</p>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 md:text-right">
                      <p>Status: <span className="font-semibold text-slate-900">{order.status}</span></p>
                      <p>Subtotal: <span className="font-semibold text-slate-900">{money(order.subtotal)}</span></p>
                      <p>Delivery: <span className="font-semibold text-slate-900">{money(order.delivery_fee)}</span></p>
                      <p>Total: <span className="font-semibold text-slate-900">{money(order.total)}</span></p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600 space-y-2">
                    <p>
                      <span className="font-semibold text-slate-900">Address:</span>{" "}
                      {order.customers?.address}
                      {order.customers?.city ? `, ${order.customers.city}` : ""}, {order.customers?.state}
                    </p>
                    <ul className="space-y-1">
                      {order.order_items?.map((item) => (
                        <li key={item.id}>
                          {item.name} ({item.size}) x {item.quantity} - {money(item.price * item.quantity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
