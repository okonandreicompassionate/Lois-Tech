"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../components/cartProvider";
import { supabase } from "../../lib/supabase";
import { ShoppingCart, ChevronDown } from "lucide-react";

type Variant = {
  id: string;
  option_label: string;
  option_value: string;
  stock: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type Product = {
  id: string;
  name: string;
  image_url: string;
  is_featured: boolean;
  is_commission: boolean;
  price: number;
  category_id: string;
  categories: Category[] | null;
  variants: Variant[];
};

export default function LandingPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    async function fetchData() {
      const [{ data: productData, error: productError }, { data: categoryData }] = await Promise.all([
        supabase
          .from("products")
          .select(`
            id,
            name,
            image_url,
            is_featured,
            is_commission,
            price,
            category_id,
            categories ( id, name, slug, description ),
            variants ( id, option_label, option_value, stock )
          `)
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug, description"),
      ]);

      if (productError) {
        console.error("Error fetching products:", productError.message);
      }

      setProducts(productData ?? []);
      setCategories(categoryData ?? []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredProducts =
    activeFilter === "ALL"
      ? products
      : activeFilter === "FEATURED"
      ? products.filter((p) => p.is_featured)
      : products.filter((p) => p.categories?.[0]?.slug === activeFilter);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant = product.variants[0];
    if (!defaultVariant) return;

    addToCart({
      id: defaultVariant.id,
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      size: defaultVariant.option_value,
      price: product.price,
      quantity: 1,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-slate-200 min-h-screen text-slate-900 font-titillium">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-200/80 backdrop-blur-xl border-b border-slate-300/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <img src="https://i.imgur.com/IGBf9Dh.png" alt="LoisTech" className="h-8 w-auto" />
            <span className="text-base font-semibold tracking-tight text-slate-900">LOIS TECH</span>
          </Link>

          {/* CATEGORY NAV */}
          <div className="hidden lg:flex items-center gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.slug)}
                className={`text-xs font-medium tracking-wide transition-colors ${
                  activeFilter === cat.slug ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* CART */}
          <Link href="/cart" className="relative flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors">
            <ShoppingCart size={25} strokeWidth={1.5} />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-slate-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative w-full h-[70vh] sm:h-screen overflow-hidden">
        <img
          src="https://i.imgur.com/uPgwKby.jpeg"
          alt="Hero"
          className="w-full h-full object-cover grayscale brightness-75 contrast-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-slate-200" />

      {/* gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 via-black/30 to-transparent" />

  <div className="absolute bottom-40 left-4 sm:left-8 lg:left-16">
    <p className="text-[12px] tracking-[0.5em] uppercase text-slate-200/80 mb-4">
      The Future of
    </p>

    <h2 className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-none tracking-tight text-white drop-shadow-lg">
      Intelligent<br />Living
    </h2>

    <p className="text-[12px] tracking-[0.4em] uppercase text-black-100/80 mt-5">
      Smart Automation · Security Systems · Acoustic & Interior Integration
    </p>
  </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-gray-50/40 flex items-center justify-center animate-bounce">
            <ChevronDown size={12} className="text-white" />
          </div>
        </div>
      </div>

      {/* SHOP BY CATEGORY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <p className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-6">
          Shop by Department
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
              activeFilter === "ALL"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
          >
            <p className="text-sm font-semibold mb-1">All Products</p>
            <p className={`text-xs leading-relaxed ${activeFilter === "ALL" ? "text-white/60" : "text-slate-500"}`}>
              Browse the full collection
            </p>
          </button>

          {categories.map((cat) => {
            const isActive = activeFilter === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.slug)}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                <p className="text-sm font-semibold mb-1">{cat.name}</p>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isActive ? "text-white/60" : "text-slate-500"}`}>
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-300/60" />
      </div>

      {/* PRODUCTS SECTION */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {activeFilter === "ALL"
                ? "All Products"
                : activeFilter === "FEATURED"
                ? "Featured"
                : categories.find((c) => c.slug === activeFilter)?.name ?? "Products"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="relative">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs px-4 py-2 pr-8 outline-none cursor-pointer rounded-xl transition-colors hover:border-slate-400"
            >
              <option value="ALL">All</option>
              <option value="FEATURED">Featured</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-200">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                  <div className="h-9 bg-slate-100 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCT GRID */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const optionLabel = product.variants[0]?.option_label ?? "Option";

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-500 hover:shadow-lg hover:shadow-slate-200/80 flex flex-col"
                >
                  {/* IMAGE */}
                  <div className="aspect-square overflow-hidden bg-slate-100 relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {product.is_featured && (
                      <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest text-slate-900 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200">
                        Featured
                      </span>
                    )}

                    {product.is_commission && (
                      <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest text-amber-900 bg-amber-100/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-200">
                        Bespoke
                      </span>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-4 sm:p-5 flex flex-col flex-grow gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1 tracking-wide uppercase">
                        {product.categories?.[0]?.name ?? "LoisTech"}
                      </p>
                      <p className="text-sm sm:text-base text-slate-900 font-semibold leading-snug">
                        {product.name}
                      </p>
                    </div>

                    {product.is_commission ? (
                      <p className="text-sm font-medium text-slate-500">
                        Custom pricing on consultation
                      </p>
                    ) : (
                      <p className="text-base font-semibold text-slate-900">
                        ₦{(product.price / 100).toLocaleString()}
                      </p>
                    )}

                    {/* OPTION PILLS */}
                    {!product.is_commission && product.variants.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {product.variants.slice(0, 4).map((v) => (
                          <span
                            key={v.id}
                            className={`text-[10px] px-2 py-1 rounded-md border tracking-wide ${
                              v.stock === 0
                                ? "border-slate-200 text-slate-300"
                                : "border-slate-300 text-slate-600"
                            }`}
                          >
                            {v.option_value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* BUTTONS */}
                    <div className="flex gap-2 mt-auto pt-1">
                      <Link
                        href={`/product/${product.id}`}
                        className="flex-1 py-2.5 text-[11px] tracking-widest uppercase text-center border border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all duration-300 rounded-xl"
                      >
                        Details
                      </Link>

                      {product.is_commission ? (
                        <Link
                          href={`/product/${product.id}`}
                          className="flex-1 py-2.5 text-[11px] tracking-widest uppercase font-semibold rounded-xl text-center bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300"
                        >
                          Commission
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={`flex-1 py-2.5 text-[11px] tracking-widest uppercase font-semibold rounded-xl transition-all duration-300 ${
                            addedId === product.id
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          {addedId === product.id ? "Added ✓" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-slate-400 text-[10px] tracking-[0.3em] uppercase">
              No products in this department yet
            </p>
            <button
              onClick={() => setActiveFilter("ALL")}
              className="text-[10px] tracking-widest uppercase text-slate-600 border border-slate-300 px-6 py-2.5 rounded-xl hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              View All
            </button>
          </div>
        )}
      </div>

      {/* CONSULTATION CTA STRIP */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">
            Bespoke Engineering
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Looking for something fully custom?
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto mb-8 leading-relaxed">
            Acoustic Engineering and Interior Design pieces are tailored entirely
            to your space and aesthetic. Request a consultation to begin.
          </p>
          <Link
            href="/#consult"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/90 transition-colors"
          >
            Request Consultation
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="https://i.imgur.com/IGBf9Dh.png" alt="LoisTech" className="h-7 w-auto" />
                <span className="text-sm font-semibold tracking-tight text-slate-900">LOIS TECH</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Privacy-first, build-integrated smart infrastructure for modern living.
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">Shop</p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {categories.map((cat) => (
                  <li key={cat.id} onClick={() => setActiveFilter(cat.slug)} className="hover:text-slate-900 cursor-pointer transition-colors">
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">Company</p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li><Link href="/#us" className="hover:text-slate-900 transition-colors">About</Link></li>
                <li><Link href="/#process" className="hover:text-slate-900 transition-colors">Process</Link></li>
                <li><Link href="/#testimonies" className="hover:text-slate-900 transition-colors">Testimonials</Link></li>
                <li><Link href="/#hiring" className="hover:text-slate-900 transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* TRUST & POLICIES */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">Trust & Policies</p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li><Link href="/policies/returns" className="hover:text-slate-900 transition-colors">Returns & Exchange Policy</Link></li>
                <li className="text-[10px] text-slate-400 leading-relaxed">(No refund on no damage)</li>
                <li><Link href="/policies/sop" className="hover:text-slate-900 transition-colors">4-Phase SOP Summary</Link></li>
                <li><Link href="/policies/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/policies/terms" className="hover:text-slate-900 transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-200/60 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 tracking-widest uppercase">
            <p>© {new Date().getFullYear()} LoisTech. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/l0istech?igsh=NzczbDQ4d2RheGx2" target="_blank" className="hover:text-slate-900 cursor-pointer transition-colors">Instagram</a>
              <a href="https://www.facebook.com/share/1GgpCW8D73/" target="_blank" className="hover:text-slate-900 cursor-pointer transition-colors">Facebook</a>
              <a href="https://ng.linkedin.com/in/lois-tech-491a15380" target="_blank" className="hover:text-slate-900 cursor-pointer transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}