"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, ChevronRight, ArrowLeft } from "lucide-react";
import { useCart } from "../../components/cartProvider";
import { supabase } from "../../../lib/supabase";
import {
  formatCurrency,
  getDiscountPercentage,
  getDiscountedPrice,
} from "../../../lib/pricing";

type Variant = {
  id: string;
  option_label: string;
  option_value: string;
  stock: number;
};

type ProductImage = {
  id: string;
  image_url: string;
  position: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  discount_percentage?: number | null;
  is_commission: boolean;
  categories: { name: string }[] | null;
  variants: Variant[];
  product_images: ProductImage[];
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [mainImage, setMainImage] = useState("");
  const [activeThumb, setActiveThumb] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const productSoldOut = product
    ? product.variants.length > 0 &&
      product.variants.every((variant) => variant.stock <= 0)
    : false;

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          image_url,
          price,
          is_commission,
          categories ( name ),
          variants ( id, option_label, option_value, stock ),
          product_images ( id, image_url, position )
        `,
        )
        .eq("id", params.id)
        .single();

      if (error || !data) {
        console.error("Product fetch error:", error?.message);
        setLoading(false);
        return;
      }

      const sorted = [...(data.product_images ?? [])].sort(
        (a, b) => a.position - b.position,
      );

      setProduct({ ...data, product_images: sorted });
      setMainImage(sorted[0]?.image_url ?? data.image_url);
      setLoading(false);
    }

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!selectedVariant || !product) return;

    const discountPercentage = getDiscountPercentage(product, product.id);
    const finalPrice = getDiscountedPrice(product.price, discountPercentage);

    addToCart({
      id: selectedVariant.id,
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      size: selectedVariant.option_value,
      price: finalPrice,
      quantity: 1,
      max_quantity: selectedVariant.stock,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      router.push("/cart");
    }, 1000);
  };

  const handleThumb = (img: ProductImage, idx: number) => {
    setMainImage(img.image_url);
    setActiveThumb(idx);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 flex font-titillium">
        <div className="w-full md:w-1/2 h-screen bg-slate-100 animate-pulse" />
        <div className="hidden md:flex flex-col gap-6 flex-1 p-16 pt-24">
          <div className="h-3 bg-slate-100 rounded-full w-1/4 animate-pulse" />
          <div className="h-8 bg-slate-100 rounded-full w-3/4 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded-full w-1/4 animate-pulse" />
          <div className="flex gap-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-16 h-12 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-14 bg-slate-100 rounded-2xl mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-200 text-slate-900 flex items-center justify-center font-titillium">
        <div className="text-center space-y-4">
          <p className="text-slate-400 text-xs tracking-[0.3em] uppercase">
            Product not found
          </p>
          <Link
            href="/shop"
            className="text-xs tracking-widest uppercase text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 px-6 py-3 rounded-xl inline-block hover:border-slate-400"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const gallery =
    product.product_images.length > 0
      ? product.product_images
      : [{ id: "main", image_url: product.image_url, position: 0 }];

  const optionLabel = product.variants[0]?.option_label ?? "Option";
  const discountPercentage = getDiscountPercentage(product, product.id);
  const finalPrice = getDiscountedPrice(product.price, discountPercentage);

  return (
    <div className="bg-slate-200 min-h-screen text-slate-900 font-titillium">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-200/80 backdrop-blur-xl border-b border-slate-300/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all duration-300 text-xs tracking-widest uppercase flex-1"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            <span className="group-hover:tracking-[0.2em] transition-all duration-300">
              Back
            </span>
          </button>

          <Link
            href="/shop"
            className="flex items-center gap-2 flex-1 justify-center"
          >
            <img
              src="https://i.imgur.com/IGBf9Dh.png"
              alt="LoisTech"
              className="h-7 w-auto"
            />
            <span className="text-base font-semibold tracking-tight text-slate-900">
              LOIS TECH
            </span>
          </Link>

          <div className="flex justify-end flex-1">
            <Link
              href="/cart"
              className="relative text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ShoppingCart size={25} strokeWidth={1.5} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-slate-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* BREADCRUMB */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-24 pb-4">
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-slate-400">
          <Link href="/shop" className="hover:text-slate-600 transition-colors">
            Shop
          </Link>
          <ChevronRight size={10} />
          <span className="text-slate-500">
            {product.categories?.[0]?.name ?? "Product"}
          </span>
          <ChevronRight size={10} />
          <span className="text-slate-600 truncate max-w-[200px]">
            {product.name}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* LEFT — IMAGE GALLERY */}
          <div className="flex gap-3">
            {gallery.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
                {gallery.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => handleThumb(img, idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                      activeThumb === idx
                        ? "border-slate-900 opacity-100"
                        : "border-slate-200 opacity-60 hover:opacity-90 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative">
              <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 aspect-square">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              </div>

              {gallery.length > 1 && (
                <div className="flex sm:hidden gap-2 mt-3 justify-center">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => handleThumb(img, idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        activeThumb === idx
                          ? "border-slate-900"
                          : "border-slate-200 opacity-60"
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — PRODUCT INFO */}
          <div className="flex flex-col gap-6 md:pt-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400">
                  {product.categories?.[0]?.name ?? "LoisTech"}
                </p>
                {product.is_commission && (
                  <span className="text-[9px] uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                    Bespoke
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-slate-900">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3 mt-3">
                {product.is_commission ? (
                  <p className="text-lg font-medium text-slate-500">
                    Custom pricing on consultation
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(finalPrice)}
                    </p>
                    {discountPercentage > 0 && (
                      <span className="text-sm text-emerald-600 font-medium">
                        {discountPercentage}% off
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-300/60" />

            {/* COMMISSION FLOW */}
            {product.is_commission ? (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-xs tracking-[0.2em] uppercase text-slate-500">
                    This is a bespoke piece
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This item is engineered entirely around your space and
                    aesthetic preferences. Request a consultation and our team
                    will design a tailored solution and provide a custom quote.
                  </p>
                </div>

                <Link
                  href="/#consult"
                  className="w-full py-4 rounded-2xl text-xs tracking-[0.3em] uppercase font-semibold transition-all duration-300 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 text-center"
                >
                  Request Consultation
                </Link>
              </>
            ) : (
              <>
                {/* OPTION SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-[0.2em] uppercase text-slate-500">
                      Select {optionLabel}
                      {selectedVariant && (
                        <span className="text-slate-900 ml-2">
                          — {selectedVariant.option_value}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {product.variants.map((variant) => {
                      const outOfStock = variant.stock === 0;
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          onClick={() =>
                            !outOfStock && setSelectedVariant(variant)
                          }
                          disabled={outOfStock}
                          className={`px-4 py-3 rounded-xl text-xs font-medium transition-all duration-300 relative ${
                            outOfStock
                              ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200"
                              : isSelected
                                ? "bg-slate-900 text-white border-2 border-slate-900 shadow-lg shadow-slate-900/10"
                                : "bg-white text-slate-700 border border-slate-300 hover:border-slate-500"
                          }`}
                        >
                          {variant.option_value}
                          {outOfStock && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-8 h-px bg-slate-300 rotate-45 absolute" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedVariant &&
                    selectedVariant.stock > 0 &&
                    selectedVariant.stock <= 3 && (
                      <p className="text-[10px] text-red-500 mt-3 uppercase tracking-widest">
                        Only {selectedVariant.stock} left in stock
                      </p>
                    )}
                </div>

                {/* ADD TO CART */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || added || productSoldOut}
                  className={`w-full py-4 rounded-2xl text-xs tracking-[0.3em] uppercase font-semibold transition-all duration-300 ${
                    added || productSoldOut
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : !selectedVariant
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                  }`}
                >
                  {added
                    ? "✓ Added to Cart"
                    : productSoldOut
                      ? "Sold Out"
                      : !selectedVariant
                        ? `Select a ${optionLabel}`
                        : "Add to Cart"}
                </button>
              </>
            )}

            <div className="border-t border-slate-300/60" />

            {/* DESCRIPTION */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">
                  About This Product
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-slate-400 mb-1">
                    Delivery
                  </p>
                  <p className="text-xs text-slate-700">
                    {product.is_commission
                      ? "Scoped on consultation"
                      : "3–5 working days"}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-slate-400 mb-1">
                    Returns
                  </p>
                  <p className="text-xs text-slate-700">
                    {product.is_commission
                      ? "No refund — no damage"
                      : "7 day policy"}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-slate-400 mb-1">
                    Warranty
                  </p>
                  <p className="text-xs text-slate-700">12 months</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-slate-400 mb-1">
                    Support
                  </p>
                  <p className="text-xs text-slate-700">24/7 monitoring</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
