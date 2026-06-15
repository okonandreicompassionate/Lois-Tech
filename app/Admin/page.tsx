"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, CheckCircle } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type Category = { id: string; name: string; slug: string };
type VariantRow = { option_value: string; stock: number };

const inputClass = "w-full bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-zinc-600 transition-colors placeholder-zinc-600";

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
    is_featured: false,
    is_commission: false,
  });

  const [optionLabel, setOptionLabel] = useState("Color");
  const [variants, setVariants] = useState<VariantRow[]>([
    { option_value: "", stock: 0 },
  ]);

  const [images, setImages] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    if (authed) fetchCategories();
  }, [authed]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("id, name, slug");
    setCategories(data ?? []);
  }

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
    setVariants([...variants, { option_value: "", stock: 0 }]);
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
    updated[idx] = val;
    setImages(updated);
  }

  function addImageSlot() {
    setImages([...images, ""]);
  }

  function removeImageSlot(idx: number) {
    setImages(images.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!form.name || !form.price || !form.image_url || !form.category_id) {
      alert("Fill in all required fields!");
      return;
    }

    const validVariants = variants.filter((v) => v.option_value.trim() !== "");
    if (validVariants.length === 0) {
      alert(`Add at least one ${optionLabel} option!`);
      return;
    }

    setLoading(true);

    try {
      const priceInKobo = Math.round(parseFloat(form.price) * 100);

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
          validVariants.map((v) => ({
            product_id: product.id,
            option_label: optionLabel,
            option_value: v.option_value,
            stock: v.stock,
          }))
        );

      if (variantError) {
        alert("Failed to add variants: " + variantError.message);
        setLoading(false);
        return;
      }

      const validImages = images
        .map((url, idx) => ({ url: url.trim(), idx }))
        .filter((i) => i.url !== "");

      if (validImages.length > 0) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(
            validImages.map((i) => ({
              product_id: product.id,
              image_url: i.url,
              position: i.idx,
            }))
          );

        if (imageError) {
          alert("Failed to add images: " + imageError.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category_id: "",
        is_featured: false,
        is_commission: false,
      });
      setOptionLabel("Color");
      setVariants([{ option_value: "", stock: 0 }]);
      setImages(["", "", ""]);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }

    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-bold tracking-[0.4em] text-sm uppercase mb-2">LOISTECH</h1>
            <p className="text-zinc-600 text-xs tracking-widest uppercase">Admin Access</p>
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
              className="w-full py-3.5 bg-white text-zinc-950 text-xs tracking-[0.25em] uppercase font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-bold tracking-[0.4em] text-sm uppercase">LOISTECH Admin</h1>
            <span className="text-zinc-700 text-xs">|</span>
            <span className="text-zinc-400 text-xs tracking-widest uppercase">Add Product</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/edit")}
              className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
            >
              Edit Products
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
            >
              View Shop
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 pb-24">

        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 text-sm">
            <CheckCircle size={16} />
            Product added successfully! It's live now.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — BASIC INFO */}
          <div className="space-y-6">

            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-4">
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₦</span>
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

                {/* FEATURED TOGGLE */}
                <label className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_featured ? "bg-white" : "bg-zinc-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-zinc-950 rounded-full transition-all ${form.is_featured ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-white">Mark as Featured</p>
                    <p className="text-[10px] text-zinc-600">Shows "New" badge on product card</p>
                  </div>
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleFormChange} className="hidden" />
                </label>

                {/* COMMISSION TOGGLE */}
                <label className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_commission ? "bg-amber-400" : "bg-zinc-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-zinc-950 rounded-full transition-all ${form.is_commission ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-white">Commission / Bespoke Item</p>
                    <p className="text-[10px] text-zinc-600">Shows "Request Consultation" instead of Add to Cart</p>
                  </div>
                  <input type="checkbox" name="is_commission" checked={form.is_commission} onChange={handleFormChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* VARIANTS */}
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-4">
                Product Options
              </p>

              <div className="mb-3">
                <p className="text-xs text-zinc-400 mb-2">What kind of option is this?</p>
                <div className="flex gap-2 flex-wrap">
                  {["Color", "Finish", "Wattage", "Storage", "Model"].map((label) => (
                    <button
                      key={label}
                      onClick={() => setOptionLabel(label)}
                      className={`px-4 py-2 rounded-xl text-xs transition-all border ${
                        optionLabel === label
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`${optionLabel} (e.g. Black)`}
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
                      onClick={() => removeVariantRow(idx)}
                      className="text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addVariantRow}
                className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-zinc-500 hover:text-white transition-colors mt-3"
              >
                <Plus size={11} />
                Add Another {optionLabel}
              </button>
            </div>

          </div>

          {/* RIGHT — IMAGES */}
          <div className="space-y-6">

            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-4">
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
                <div className="mt-3 aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500">
                  Gallery Images
                </p>
                <button
                  onClick={addImageSlot}
                  className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
                >
                  <Plus size={11} />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {images.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder={`Image ${idx + 1} URL`}
                        value={url}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        className={inputClass}
                      />
                      {url && (
                        <div className="h-24 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImageSlot(idx)}
                      className="mt-3 text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 px-4 py-3 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  💡 Upload photos at <span className="text-zinc-300">imgur.com</span> → right click image → Copy Image Address → paste above
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10 border-t border-zinc-800/60 pt-8">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 text-xs tracking-[0.3em] uppercase font-semibold rounded-xl transition-all duration-300 ${
              loading
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white text-zinc-950 hover:bg-zinc-100 shadow-lg shadow-white/5"
            }`}
          >
            {loading ? "Adding Product..." : "Add Product to Shop"}
          </button>
          <p className="text-zinc-700 text-[10px] tracking-wide text-center mt-3">
            Product goes live instantly after adding
          </p>
        </div>

      </div>
    </div>
  );
}