"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ShoppingBag, Truck, ChevronDown,ShoppingCart } from "lucide-react";
import { useCart } from "../components/cartProvider";
import { supabase } from "../../lib/supabase";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const EXPRESS_STATES = ["Lagos", "Abuja", "Rivers"];

const DELIVERY_PRICES: Record<string, number> = {
  Lagos: 6000,
  Abuja: 11000,
  Rivers: 11000,
  other: 11500,
};

function getDeliveryFee(state: string): number {
  if (!state) return 0;
  if (EXPRESS_STATES.includes(state)) return DELIVERY_PRICES[state];
  return DELIVERY_PRICES.other;
}

function getDeliveryLabel(state: string): string {
  if (!state) return "";
  if (EXPRESS_STATES.includes(state))
    return `Express Delivery — ₦${DELIVERY_PRICES[state].toLocaleString()}`;
  return `Standard Delivery (5–7 days) — ₦${DELIVERY_PRICES.other.toLocaleString()}`;
}

const inputClass =
  "w-full bg-white border border-slate-300 text-slate-900 text-sm px-4 py-3.5 rounded-xl outline-none focus:border-slate-500 transition-colors placeholder-slate-400";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"bag" | "delivery">("bag");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
  });

  const deliveryFee = getDeliveryFee(form.state);
  const grandTotal = cartTotal + deliveryFee * 100;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    if (
      !form.email ||
      !form.name ||
      !form.phone ||
      !form.address ||
      !form.state
    ) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);

    try {
      const variantIds = cartItems.map((item) => item.id);
      const { data: variantRows, error: stockFetchError } = await supabase
        .from("variants")
        .select("id, stock")
        .in("id", variantIds);

      if (stockFetchError) {
        throw new Error("Could not confirm current stock. Please try again.");
      }

      const variantStockMap = new Map(
        (variantRows ?? []).map((variant: any) => [variant.id, Number(variant.stock) || 0])
      );
      const insufficientItem = cartItems.find((item) => {
        const availableStock = variantStockMap.get(item.id) ?? item.max_quantity ?? 0;
        return availableStock < item.quantity;
      });

      if (insufficientItem) {
        const availableStock = variantStockMap.get(insufficientItem.id) ?? 0;
        alert(
          `${insufficientItem.name} (${insufficientItem.size}) only has ${availableStock} left in stock.`
        );
        setLoading(false);
        return;
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          whatsapp: form.whatsapp || null,
          address: form.address,
          city: form.city || null,
          state: form.state,
        })
        .select()
        .single();

      if (customerError || !customer) {
        throw new Error(customerError?.message || "Failed to save customer details.");
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          subtotal: cartTotal,
          delivery_fee: deliveryFee * 100,
          total: grandTotal,
          status: "pending",
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message || "Failed to create order.");
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);
      if (orderItemsError) {
        throw new Error(orderItemsError.message);
      }

      for (const item of cartItems) {
        const currentStock = variantStockMap.get(item.id) ?? 0;
        const nextStock = currentStock - item.quantity;
        const { data: updatedStockRow, error: stockUpdateError } = await supabase
          .from("variants")
          .update({ stock: nextStock })
          .eq("id", item.id)
          .eq("stock", currentStock)
          .select("id")
          .maybeSingle();

        if (stockUpdateError || !updatedStockRow) {
          throw new Error(
            `${item.name} stock changed while checking out. Please review your cart and try again.`
          );
        }
      }

      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          form,
          cartItems,
          subtotal: cartTotal,
          deliveryFee,
          total: grandTotal,
          orderId: order.id,
        })
      );
      window.location.href = "/pay";
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Something went wrong. Please try again!");
      setLoading(false);
    }
  };

  // ── EMPTY STATE ────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-200 text-slate-900 flex flex-col items-center justify-center gap-6 px-4 font-titillium">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <ShoppingBag size={24} strokeWidth={1.5} className="text-slate-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-semibold mb-1">Your bag is empty</p>
          <p className="text-slate-500 text-xs tracking-wide">
            Add something to get started
          </p>
        </div>
        <Link
          href="/shop"
          className="bg-slate-900 text-white text-xs tracking-[0.2em] uppercase px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  // ── MAIN CART ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-titillium">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-slate-200/80 backdrop-blur-xl border-b border-slate-300/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() =>
              step === "delivery" ? setStep("bag") : window.history.back()
            }
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs tracking-widest uppercase"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>

          <Link href="/shop" className="flex items-center gap-2">
            <img
              src="https://i.imgur.com/IGBf9Dh.png"
              alt="LoisTech"
              className="h-7 w-auto"
            />
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              LOIS TECH
            </span>
          </Link>

          <span className="text-slate-500 text-xs tracking-widest uppercase">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* PROGRESS TABS */}
        <div className="flex border-t border-slate-300/60">
          <button
            onClick={() => setStep("bag")}
            className={`flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-1.5 ${
              step === "bag"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-400"
            }`}
          >
            <ShoppingCart size={11}  />
            Cart
          </button>
          <button
            onClick={() => setStep("delivery")}
            className={`flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-1.5 ${
              step === "delivery"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-400"
            }`}
          >
            <Truck size={11} />
            Delivery
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-32 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1 — BAG */}
            {step === "bag" && (
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-5">
                  Your Bag
                </p>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                    >
                      {/* THUMBNAIL */}
                      <div className="w-20 h-24 sm:w-24 sm:h-28 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-slate-900 truncate">
                              {item.name}
                            </h2>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {item.size}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                            ₦{((item.price * item.quantity) / 100).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* QTY CONTROL */}
                          <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <button
                              onClick={() =>
                                item.quantity > 1
                                  ? updateQuantity(item.id, item.size, item.quantity - 1)
                                  : removeFromCart(item.id, item.size)
                              }
                              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors text-lg leading-none"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.size, item.quantity + 1)
                              }
                              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors text-lg leading-none"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MOBILE — continue to delivery */}
                <button
                  onClick={() => setStep("delivery")}
                  className="w-full mt-6 py-4 bg-slate-900 text-white text-xs tracking-[0.25em] uppercase rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 lg:hidden"
                >
                  Continue to Delivery
                  <Truck size={14} strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* STEP 2 — DELIVERY FORM */}
            {(step === "delivery" || true) && (
              <div className={step === "bag" ? "hidden lg:block" : "block"}>
                <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-5">
                  Delivery Details
                </p>
                <div className="space-y-3">

                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name *"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address *"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone *"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      name="whatsapp"
                      placeholder="WhatsApp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <input
                    type="text"
                    name="address"
                    placeholder="Delivery Address *"
                    value={form.address}
                    onChange={handleChange}
                    className={inputClass}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={form.city}
                      onChange={handleChange}
                      className={inputClass}
                    />

                    <div className="relative">
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className={`${inputClass} appearance-none cursor-pointer pr-10`}
                      >
                        <option value="">State *</option>
                        <optgroup label="Express Delivery">
                          {EXPRESS_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s} — ₦{DELIVERY_PRICES[s].toLocaleString()}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Standard ₦11,500">
                          {NIGERIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* DELIVERY TAG */}
                  {form.state && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <Truck size={14} strokeWidth={1.5} className="text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-600">
                        {getDeliveryLabel(form.state)}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* RIGHT — ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:sticky lg:top-32 shadow-sm">
              <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 pb-3 border-b border-slate-200">
                Order Summary
              </p>

              {/* ITEMS */}
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex justify-between text-xs"
                  >
                    <span className="text-slate-500 truncate pr-2">
                      {item.name} ({item.size}) ×{item.quantity}
                    </span>
                    <span className="text-slate-700 flex-shrink-0">
                      ₦{((item.price * item.quantity) / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>₦{(cartTotal / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivery</span>
                  {form.state ? (
                    <span className="text-slate-900 font-medium">
                      ₦{deliveryFee.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Select state</span>
                  )}
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>₦{(grandTotal / 100).toLocaleString()}</span>
                </div>
              </div>

              {/* CHECKOUT */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-4 text-xs tracking-[0.25em] uppercase font-semibold rounded-xl transition-all duration-300 ${
                  loading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                }`}
              >
                {loading ? "Redirecting..." : "Proceed to Payment"}
              </button>

              <p className="text-slate-400 text-[10px] tracking-wide text-center">
                Fill all required fields before paying.{" "}
                <Link href="/policies/returns" className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                  Returns Policy
                </Link>
              </p>

              <Link
                href="/shop"
                className="block text-center text-[10px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-900 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE FIXED BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-200/95 backdrop-blur-xl border-t border-slate-300/60 lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 uppercase tracking-widest">Total</span>
          <span className="text-sm font-semibold text-slate-900">
            ₦{(grandTotal / 100).toLocaleString()}
          </span>
        </div>
        <button
          onClick={step === "bag" ? () => setStep("delivery") : handleCheckout}
          disabled={loading}
          className={`w-full py-4 text-xs tracking-[0.25em] uppercase font-semibold rounded-xl transition-all ${
            loading
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {loading
            ? "Redirecting..."
            : step === "bag"
            ? "Continue to Delivery"
            : "Proceed to Payment"}
        </button>
      </div>

    </div>
  );
}
