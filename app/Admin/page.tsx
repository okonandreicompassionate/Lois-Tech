"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { clampDiscountPercentage, persistProductDiscount } from "../../lib/pricing";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type Category = { id: string; name: string; slug: string };
type VariantRow = { client_id: string; option_value: string; stock: number };
type ImageRow = { client_id: string; url: string };

const inputClass = "w-full bg-white border border-slate-300 text-slate-900 text-sm px-4 py-3 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200 transition-colors placeholder-slate-400";

function createRowId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AdminPage() {
  const router = useRouter();

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: "",
    discount_percentage: "",
    is_featured: false,
    is_commission: false,
  });

  const [hasVariants, setHasVariants] = useState(false);
  const [optionLabel, setOptionLabel] = useState("Color");
  const [variants, setVariants] = useState<VariantRow[]>([
    { client_id: createRowId(), option_value: "", stock: 0 },
  ]);
  const [singleStock, setSingleStock] = useState(0);

  const [images, setImages] = useState<ImageRow[]>([
    { client_id: createRowId(), url: "" },
    { client_id: createRowId(), url: "" },
    { client_id: createRowId(), url: "" },
  ]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("id, name, slug");
    setCategories(data ?? []);
  }

  useEffect(() => {
    if (authed) {
      fetchCategories();
    }
  }, [authed]);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) setAuthed(true);
    else alert("Wrong password!");
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : target.value;
    setForm({ ...form, [target.name]: value });
  }

  function addVariantRow() {
    setVariants([...variants, { client_id: createRowId(), option_value: "", stock: 0 }]);
  }

  function removeVariantRow(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof VariantRow, value: string | number) {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setVariants(updated);
  }

  function handleImageChange(idx: number, val: string) {
    const updated = [...images];
    updated[idx] = { ...updated[idx], url: val };
    setImages(updated);
  }

  function addImageSlot() {
    setImages([...images, { client_id: createRowId(), url: "" }]);
  }

  function removeImageSlot(idx: number) {
    setImages(images.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!form.name || !form.price || !form.image_url || !form.category_id) {
      alert("Fill in all required fields!");
      return;
    }

    let variantsToInsert: { option_label: string; option_value: string; stock: number }[] = [];

    if (hasVariants) {
      if (!optionLabel.trim()) {
        alert("Give your option a name (e.g. Color, Wattage)!");
        return;
      }
      const validVariants = variants.filter((v) => v.option_value.trim() !== "");
      if (validVariants.length === 0) {
        alert(`Add at least one ${optionLabel} value!`);
        return;
      }
      variantsToInsert = validVariants.map((v) => ({
        option_label: optionLabel.trim(),
        option_value: v.option_value.trim(),
        stock: v.stock,
      }));
    } else {
      variantsToInsert = [
        { option_label: "Stock", option_value: "Standard", stock: singleStock },
      ];
    }

    setLoading(true);

    try {
      const priceInKobo = Math.round(parseFloat(form.price) * 100);
      const discountPercentage = clampDiscountPercentage(form.discount_percentage);

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: form.name,
          description: form.description,
          price: priceInKobo,
          image_url: form.image_url,
          category_id: form.category_id,
          is_featured: form.is_featured,
          is_commission: form.is_commission,
        })
        .select()
        .single();

      if (productError || !product) {
        alert("Failed to add product: " + productError?.message);
        setLoading(false);
        return;
      }

      const { error: variantError } = await supabase
        .from("variants")
        .insert(
          variantsToInsert.map((v) => ({
            product_id: product.id,
            ...v,
          }))
        );

      if (variantError) {
        alert("Failed to add variants: " + variantError.message);
        setLoading(false);
        return;
      }

      const validImages = images
        .map((image) => image.url.trim())
        .filter((url) => url !== "");

      if (validImages.length > 0) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(
            validImages.map((url, idx) => ({
              product_id: product.id,
              image_url: url,
              position: idx,
            }))
          );

        if (imageError) {
          alert("Failed to add images: " + imageError.message);
          setLoading(false);
          return;
        }
      }

      await persistProductDiscount(product.id, discountPercentage, supabase);

      setSuccess(true);
      setForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category_id: "",
        discount_percentage: "",
        is_featured: false,
        is_commission: false,
      });
      setHasVariants(false);
      setOptionLabel("Color");
      setVariants([{ client_id: createRowId(), option_value: "", stock: 0 }]);
      setSingleStock(0);
      setImages([
        { client_id: createRowId(), url: "" },
        { client_id: createRowId(), url: "" },
        { client_id: createRowId(), url: "" },
      ]);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }

    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-200 text-slate-900 flex items-center justify-center px-4 font-titillium">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-semibold tracking-[0.3em] text-sm uppercase mb-2">LOIS TECH</h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase">Admin Access</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={inputClass}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold tracking-[0.3em] text-sm uppercase">LOIS TECH Admin</h1>
            <span className="text-slate-400 text-xs">|</span>
            <span className="text-slate-500 text-xs tracking-widest uppercase">Add Product</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/Admin/edit")} className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              Edit Products
            </button>
            <button onClick={() => router.push("/Admin/orders")} className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              Orders
            </button>
            <button onClick={() => router.push("/")} className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              View Shop
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 pb-24">

        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <CheckCircle size={16} />
            Product added successfully! It&apos;s live now.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — BASIC INFO */}
          <div className="space-y-6">

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4">
                Product Info
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name *"
                  value={form.name}
                  onChange={handleFormChange}
                  className={inputClass}
                />

                <textarea
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                    <input
                      type="number"
                      name="price"
                      placeholder="Price *"
                      value={form.price}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-8`}
                    />
                  </div>

                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleFormChange}
                    className={inputClass}
                  >
                    <option value="">Category *</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    name="discount_percentage"
                    placeholder="Discount %"
                    value={form.discount_percentage}
                    onChange={handleFormChange}
                    className={`${inputClass} pr-10`}
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>

                <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                  <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_featured ? "bg-slate-900" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${form.is_featured ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-900">Mark as Featured</p>
                    <p className="text-[10px] text-slate-500">Shows &quot;Featured&quot; badge on product card</p>
                  </div>
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleFormChange} className="hidden" />
                </label>

                <label className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors">
                  <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_commission ? "bg-amber-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${form.is_commission ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-900">Commission / Bespoke Item</p>
                    <p className="text-[10px] text-amber-700">Shows &quot;Request Consultation&quot; instead of Add to Cart</p>
                  </div>
                  <input type="checkbox" name="is_commission" checked={form.is_commission} onChange={handleFormChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* STOCK & OPTIONS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4">
                Stock & Options
              </p>

              {/* TOGGLE */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setHasVariants(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium transition-all border text-left ${
                    !hasVariants
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span className="block">Single Item</span>
                  <span className={`block text-[10px] mt-0.5 ${!hasVariants ? "text-white/60" : "text-slate-400"}`}>
                    Just one version — set total stock
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasVariants(true)}
                  className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium transition-all border text-left ${
                    hasVariants
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span className="block">Has Options</span>
                  <span className={`block text-[10px] mt-0.5 ${hasVariants ? "text-white/60" : "text-slate-400"}`}>
                    e.g. different colors, wattages
                  </span>
                </button>
              </div>

              {/* SINGLE ITEM */}
              {!hasVariants && (
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Total stock available</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 10"
                    value={singleStock}
                    onChange={(e) => setSingleStock(parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    Customers will see a simple &quot;Add to Cart&quot; button — no options to pick.
                  </p>
                </div>
              )}

              {/* HAS OPTIONS */}
              {hasVariants && (
                <>
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 mb-2 block">
                      What&apos;s this option called?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Color, Wattage, Model"
                      value={optionLabel}
                      onChange={(e) => setOptionLabel(e.target.value)}
                      className={inputClass}
                    />
                    <div className="flex gap-2 flex-wrap mt-2">
                      {["Color", "Finish", "Wattage", "Storage", "Model"].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setOptionLabel(label)}
                          className="px-3 py-1.5 rounded-lg text-[11px] bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-900 transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {optionLabel && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        Customers will see: <span className="text-slate-600">&quot;Select {optionLabel}&quot;</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div key={v.client_id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`${optionLabel || "Option"} value (e.g. Black)`}
                          value={v.option_value}
                          onChange={(e) => updateVariant(idx, "option_value", e.target.value)}
                          className={`${inputClass} flex-1`}
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Stock"
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, "stock", parseInt(e.target.value) || 0)}
                          className={`${inputClass} w-24`}
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors mt-3"
                  >
                    <Plus size={11} />
                    Add Another {optionLabel || "Value"}
                  </button>
                </>
              )}
            </div>

          </div>

          {/* RIGHT — IMAGES */}
          <div className="space-y-6">

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4">
                Main Image (Shop Grid)
              </p>
              <input
                type="text"
                name="image_url"
                placeholder="https://... paste image URL *"
                value={form.image_url}
                onChange={handleFormChange}
                className={inputClass}
              />
              {form.image_url && (
                <div className="mt-3 aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400">
                  Gallery Images
                </p>
                <button
                  type="button"
                  onClick={addImageSlot}
                  className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Plus size={11} />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {images.map((image, idx) => (
                  <div key={image.client_id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder={`Image ${idx + 1} URL`}
                        value={image.url}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        className={inputClass}
                      />
                      {image.url && (
                        <div className="h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={image.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageSlot(idx)}
                      className="mt-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  💡 Upload photos at <span className="text-slate-700">imgur.com</span> → right click image → Copy Image Address → paste above
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10 border-t border-slate-300/60 pt-8">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 text-xs tracking-[0.3em] uppercase font-semibold rounded-xl transition-all duration-300 ${
              loading
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
            }`}
          >
            {loading ? "Adding Product..." : "Add Product to Shop"}
          </button>
          <p className="text-slate-400 text-[10px] tracking-wide text-center mt-3">
            Product goes live instantly after adding
          </p>
        </div>

      </div>
    </div>
  );
}
