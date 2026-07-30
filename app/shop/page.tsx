"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../components/cartProvider";
import { supabase } from "../../lib/supabase";
import { ShoppingCart, ChevronDown, Search, X, Menu } from "lucide-react";
import {
  formatCurrency,
  getDiscountPercentage,
  getDiscountedPrice,
} from "../../lib/pricing";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";

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
  stock: number;
  discount_percentage?: number | null;
  category_id: string;
  categories: Category[] | null;
  variants: Variant[];
};

export default function LandingPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    async function fetchData() {
      const [
        { data: productData, error: productError },
        { data: categoryData },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            `
            id,
            name,
            image_url,
            is_featured,
            is_commission,
            price,
            stock,
            category_id,
            categories ( id, name, slug, description ),
            variants ( id, option_label, option_value, stock )
          `,
          )
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

  const categorySlugById = Object.fromEntries(
    categories.map((cat) => [cat.id, cat.slug]),
  );

  const categoryNameById = Object.fromEntries(
    categories.map((cat) => [cat.id, cat.name]),
  );

  const filteredProducts = products
    .filter((p) => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "FEATURED") return p.is_featured;
      return categorySlugById[p.category_id] === activeFilter;
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (categoryNameById[p.category_id] ?? "").toLowerCase().includes(q)
      );
    });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const hasVariants = product.variants.length > 0;
    const defaultVariant = hasVariants
      ? product.variants.find((variant) => variant.stock > 0)
      : null;

    if (hasVariants && !defaultVariant) return;
    if (!hasVariants && product.stock <= 0) return;

    const discountPercentage = getDiscountPercentage(product, product.id);
    const finalPrice = getDiscountedPrice(product.price, discountPercentage);

    addToCart({
      id: hasVariants ? defaultVariant!.id : product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      size: hasVariants ? defaultVariant!.option_value : "Standard",
      price: finalPrice,
      quantity: 1,
      max_quantity: hasVariants ? defaultVariant!.stock : product.stock,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const clearFilters = () => {
    setActiveFilter("ALL");
    setSearchQuery("");
  };

  const selectFilterAndClose = (slug: string) => {
    setActiveFilter(slug);
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-slate-200 min-h-screen text-slate-900 font-titillium">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-200/80 backdrop-blur-xl border-b border-slate-300/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="https://i.imgur.com/IGBf9Dh.png"
              alt="LoisTech"
              className="h-7 sm:h-8 w-auto flex-shrink-0"
            />
            <span className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 truncate">
              LOIS TECH
            </span>
          </Link>

          {/* DESKTOP CATEGORY NAV */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.slug)}
                className={`text-xs font-medium tracking-wide transition-colors whitespace-nowrap ${
                  activeFilter === cat.slug
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* RIGHT SIDE — CART + MOBILE MENU */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link
              href="/cart"
              className="relative flex items-center text-slate-700 hover:text-slate-900 transition-colors p-1"
            >
              <ShoppingCart size={22} className="sm:hidden" strokeWidth={1.5} />
              <ShoppingCart
                size={25}
                className="hidden sm:block"
                strokeWidth={1.5}
              />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 hover:bg-slate-300/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE / TABLET DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-300/60 bg-slate-200/95 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-0.5">
              <button
                onClick={() => selectFilterAndClose("ALL")}
                className={`text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === "ALL"
                    ? "bg-white text-slate-900"
                    : "text-slate-600 hover:bg-white/60"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => selectFilterAndClose(cat.slug)}
                  className={`text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === cat.slug
                      ? "bg-white text-slate-900"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <HeroSection />

      {/* SHOP BY CATEGORY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-6 sm:pb-8">
        <p className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-4 sm:mb-6">
          Shop by Department
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              activeFilter === "ALL"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
          >
            <p className="text-sm font-semibold mb-1">All Products</p>
            <p
              className={`text-xs leading-relaxed ${activeFilter === "ALL" ? "text-white/60" : "text-slate-500"}`}
            >
              Browse the full collection
            </p>
          </button>

          {categories.map((cat) => {
            const isActive = activeFilter === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.slug)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                <p className="text-sm font-semibold mb-1">{cat.name}</p>
                <p
                  className={`text-xs leading-relaxed line-clamp-2 ${isActive ? "text-white/60" : "text-slate-500"}`}
                >
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-16 sm:pb-20">
        {/* SEARCH BAR */}
        <div className="relative mb-5 sm:mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white border border-slate-300 text-slate-900 text-sm pl-11 pr-10 py-3.5 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200 transition-colors placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : activeFilter === "ALL"
                  ? "All Products"
                  : activeFilter === "FEATURED"
                    ? "Featured"
                    : (categories.find((c) => c.slug === activeFilter)?.name ??
                      "Products")}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="relative self-start sm:self-auto">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs px-4 py-2.5 pr-8 outline-none cursor-pointer rounded-xl transition-colors hover:border-slate-400 w-full sm:w-auto"
            >
              <option value="ALL">All</option>
              <option value="FEATURED">Featured</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        </div>

        {/* SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-200"
              >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProducts.map((product) => {
              const discountPercentage = getDiscountPercentage(
                product,
                product.id,
              );
              const finalPrice = getDiscountedPrice(
                product.price,
                discountPercentage,
              );
              const isSoldOut =
                product.variants.length > 0
                  ? product.variants.every((variant) => variant.stock <= 0)
                  : product.stock <= 0;

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

                    {isSoldOut && (
                      <span className="absolute left-3 bottom-3 text-[9px] uppercase tracking-widest text-white bg-red-600 px-2.5 py-1 rounded-full">
                        Sold Out
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-base font-semibold text-slate-900">
                            {formatCurrency(finalPrice)}
                          </p>
                          {discountPercentage > 0 && (
                            <p className="text-xs line-through text-slate-400">
                              {formatCurrency(product.price)}
                            </p>
                          )}
                        </div>
                        {discountPercentage > 0 && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {discountPercentage}% off
                          </span>
                        )}
                      </div>
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
                          disabled={isSoldOut}
                          className={`flex-1 py-2.5 text-[11px] tracking-widest uppercase font-semibold rounded-xl transition-all duration-300 ${
                            isSoldOut
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : addedId === product.id
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          {isSoldOut
                            ? "Sold Out"
                            : addedId === product.id
                              ? "Added ✓"
                              : "Add"}
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
            <p className="text-slate-400 text-[10px] tracking-[0.3em] uppercase text-center px-4">
              {searchQuery
                ? `No products match "${searchQuery}"`
                : "No products in this department yet"}
            </p>
            <button
              onClick={clearFilters}
              className="text-[10px] tracking-widest uppercase text-slate-600 border border-slate-300 px-6 py-2.5 rounded-xl hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              View All
            </button>
          </div>
        )}
      </div>

      {/* CONSULTATION CTA STRIP */}
      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">
            Bespoke Engineering
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-4">
            Looking for something fully custom?
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto mb-7 sm:mb-8 leading-relaxed">
            Acoustic Engineering and Interior Design pieces are tailored
            entirely to your space and aesthetic. Request a consultation to
            begin.
          </p>
          <Link
            target="_blank"
            href="http://loistech.com.ng/#consult"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/90 transition-colors"
          >
            Request Consultation
          </Link>
        </div>
      </section>

      <Footer categories={categories} onCategoryClick={setActiveFilter} />
    </div>
  );
}
