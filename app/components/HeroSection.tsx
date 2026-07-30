"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ---------------------------------------------------------------------------
// Types — mirror the tables created in supabase/hero_schema.sql
// ---------------------------------------------------------------------------
type HeroLeftItem = {
  id: string;
  icon_name: string;
  label: string;
  link_url: string | null;
  sort_order: number;
};

type HeroSlide = {
  id: string;
  image_url: string;
  eyebrow_text: string | null;
  headline: string | null;
  badge_text: string | null;
  subheadline: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
};

type HeroRightInfoItem = {
  id: string;
  icon_name: string;
  label: string;
  sublabel: string | null;
  link_url: string | null;
  sort_order: number;
};

type HeroRightBanner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
};

// ---------------------------------------------------------------------------
// Small helper — render a lucide icon by name string (as stored in the DB),
// falling back to a default icon if the admin typed something that doesn't
// match a real lucide-react export.
// ---------------------------------------------------------------------------
function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>
  )[name];
  if (!IconComponent) return <Star {...props} />;
  return <IconComponent {...props} />;
}

const AUTOPLAY_MS = 5500;

export default function HeroSection() {
  const [leftItems, setLeftItems] = useState<HeroLeftItem[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [rightInfoItems, setRightInfoItems] = useState<HeroRightInfoItem[]>([]);
  const [rightBanner, setRightBanner] = useState<HeroRightBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchHeroData() {
      const [
        { data: leftData },
        { data: slideData },
        { data: rightInfoData },
        { data: bannerData },
      ] = await Promise.all([
        supabase
          .from("hero_left_items")
          .select("id, icon_name, label, link_url, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("hero_carousel_slides")
          .select(
            "id, image_url, eyebrow_text, headline, badge_text, subheadline, cta_text, cta_link, sort_order",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(7),
        supabase
          .from("hero_right_info_items")
          .select("id, icon_name, label, sublabel, link_url, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("hero_right_banner")
          .select("id, image_url, title, subtitle, link_url")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      ]);

      setLeftItems(leftData ?? []);
      setSlides(slideData ?? []);
      setRightInfoItems(rightInfoData ?? []);
      setRightBanner(bannerData ?? null);
      setLoading(false);
    }

    fetchHeroData();
  }, []);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const goToSlide = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSlide(index);
  };

  const goPrev = () =>
    goToSlide(
      (activeSlide - 1 + Math.max(slides.length, 1)) %
        Math.max(slides.length, 1),
    );
  const goNext = () =>
    goToSlide((activeSlide + 1) % Math.max(slides.length, 1));

  const currentSlide = useMemo(
    () => slides[activeSlide],
    [slides, activeSlide],
  );

  return (
    <section className="bg-slate-200 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-3 sm:gap-4">
          {/* ============================================================= */}
          {/* LEFT COLUMN — dynamic info list                                */}
          {/* ============================================================= */}
          <aside className="hidden lg:flex flex-col bg-white border border-slate-300 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-3 space-y-3 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded-full" />
                ))}
              </div>
            ) : (
              leftItems.map((item, i) => {
                const Row = (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors ${
                      i !== leftItems.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <DynamicIcon
                      name={item.icon_name}
                      size={16}
                      strokeWidth={1.5}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
                return item.link_url ? (
                  <Link key={item.id} href={item.link_url}>
                    {Row}
                  </Link>
                ) : (
                  <div key={item.id}>{Row}</div>
                );
              })
            )}
          </aside>

          {/* ============================================================= */}
          {/* MIDDLE COLUMN — 7-image carousel                               */}
          {/* ============================================================= */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-[320px] sm:h-[380px] lg:h-[440px]">
            {loading && (
              <div className="absolute inset-0 bg-slate-300 animate-pulse" />
            )}

            {!loading &&
              slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                    i === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={slide.image_url}
                    alt={slide.headline ?? "LoisTech"}
                    className="w-full h-full object-cover grayscale brightness-75 contrast-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

                  <div className="absolute bottom-6 left-5 sm:left-8 right-5 sm:right-8">
                    {slide.eyebrow_text && (
                      <p className="text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-slate-200/80 mb-2">
                        {slide.eyebrow_text}
                      </p>
                    )}
                    {slide.headline && (
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-none tracking-tight text-white drop-shadow-lg mb-3">
                        {slide.headline}
                      </h2>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {slide.badge_text && (
                        <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase bg-white text-slate-900 px-3 py-1.5 rounded-lg">
                          {slide.badge_text}
                        </span>
                      )}
                      {slide.subheadline && (
                        <p className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-white/80 max-w-xs">
                          {slide.subheadline}
                        </p>
                      )}
                    </div>

                    {slide.cta_link && (
                      <Link
                        href={slide.cta_link}
                        className="inline-block mt-4 bg-white text-slate-900 text-[10px] sm:text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
                      >
                        {slide.cta_text || "Shop Now"}
                      </Link>
                    )}
                  </div>
                </div>
              ))}

            {!loading && slides.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-700 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToSlide(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeSlide ? "w-5 bg-white" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN — info box + single promo banner                  */}
          {/* ============================================================= */}
          <div className="hidden lg:flex flex-col gap-3 sm:gap-4">
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-3 space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-100 rounded-lg" />
                  ))}
                </div>
              ) : (
                rightInfoItems.map((item, i) => {
                  const Row = (
                    <div
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                        i !== rightInfoItems.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 flex-shrink-0">
                        <DynamicIcon
                          name={item.icon_name}
                          size={14}
                          strokeWidth={1.5}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                  return item.link_url ? (
                    <Link key={item.id} href={item.link_url}>
                      {Row}
                    </Link>
                  ) : (
                    <div key={item.id}>{Row}</div>
                  );
                })
              )}
            </div>

            <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 min-h-[180px]">
              {loading && (
                <div className="absolute inset-0 bg-slate-300 animate-pulse" />
              )}
              {!loading && rightBanner && (
                <BannerContent banner={rightBanner} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* MOBILE / TABLET — condensed strip for left + right content     */}
        {/* (left list becomes a horizontal scroller, right info becomes  */}
        {/* a 2-up row, banner stacks beneath the carousel)                */}
        {/* ============================================================= */}
        <div className="lg:hidden mt-3 sm:mt-4 space-y-3">
          {!loading && leftItems.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {leftItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.link_url ?? "#"}
                  className="flex items-center gap-2 flex-shrink-0 bg-white border border-slate-300 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-700"
                >
                  <DynamicIcon
                    name={item.icon_name}
                    size={14}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {!loading && rightInfoItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {rightInfoItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.link_url ?? "#"}
                  className="flex flex-col items-center text-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2 py-3"
                >
                  <DynamicIcon
                    name={item.icon_name}
                    size={16}
                    strokeWidth={1.5}
                    className="text-slate-700"
                  />
                  <span className="text-[10px] font-semibold text-slate-900 leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {!loading && rightBanner && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-32">
              <BannerContent banner={rightBanner} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BannerContent({ banner }: { banner: HeroRightBanner }) {
  const content = (
    <>
      <img
        src={banner.image_url}
        alt={banner.title ?? "Promotion"}
        className="w-full h-full object-cover"
      />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-4">
          {banner.title && (
            <p className="text-sm font-bold text-white leading-tight">
              {banner.title}
            </p>
          )}
          {banner.subtitle && (
            <p className="text-[10px] text-white/70 mt-0.5">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </>
  );

  return banner.link_url ? (
    <Link href={banner.link_url} className="absolute inset-0 block">
      {content}
    </Link>
  ) : (
    <div className="absolute inset-0">{content}</div>
  );
}
