"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { CheckCircle } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin1234";
const SUPERADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD ?? "superadmin1234";

const defaultSlide = (sortOrder: number) => ({
  id: undefined as string | undefined,
  image_url: "",
  eyebrow_text: "",
  headline: "",
  badge_text: "",
  subheadline: "",
  cta_text: "",
  cta_link: "",
  sort_order: sortOrder,
  is_active: false,
});

type HeroSlide = {
  id?: string;
  image_url: string;
  eyebrow_text: string;
  headline: string;
  badge_text: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  is_active: boolean;
};

export default function HeroSlidesAdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<"admin" | "superadmin" | null>(null);
  const [password, setPassword] = useState("");
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth =
      typeof window !== "undefined" && localStorage.getItem("adminAuthed");
    const savedRole =
      typeof window !== "undefined" && localStorage.getItem("adminRole");
    if (
      savedAuth === "true" &&
      (savedRole === "admin" || savedRole === "superadmin")
    ) {
      setAuthed(true);
      setRole(savedRole);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchSlides();
    }
  }, [authed]);

  async function fetchSlides() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_carousel_slides")
      .select(
        "id, image_url, eyebrow_text, headline, badge_text, subheadline, cta_text, cta_link, sort_order, is_active",
      )
      .order("sort_order", { ascending: true });

    if (error) {
      setError("Failed to load hero slides: " + error.message);
      setSlides(Array.from({ length: 7 }, (_, idx) => defaultSlide(idx + 1)));
      setLoading(false);
      return;
    }

    const loaded = (data ?? []) as HeroSlide[];
    const ordered = loaded
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 7);

    const padded = [...ordered];
    while (padded.length < 7) {
      padded.push(defaultSlide(padded.length + 1));
    }

    setSlides(padded);
    setLoading(false);
  }

  function handleLogin() {
    if (password === SUPERADMIN_PASSWORD) {
      setAuthed(true);
      setRole("superadmin");
      localStorage.setItem("adminAuthed", "true");
      localStorage.setItem("adminRole", "superadmin");
    } else if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setRole("admin");
      localStorage.setItem("adminAuthed", "true");
      localStorage.setItem("adminRole", "admin");
    } else {
      alert("Wrong password!");
    }
  }

  function handleFieldChange(
    index: number,
    field: keyof HeroSlide,
    value: string | boolean,
  ) {
    setSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = slides.map((slide, idx) => ({
      id: slide.id,
      image_url: slide.image_url.trim(),
      eyebrow_text: slide.eyebrow_text.trim(),
      headline: slide.headline.trim(),
      badge_text: slide.badge_text.trim(),
      subheadline: slide.subheadline.trim(),
      cta_text: slide.cta_text.trim(),
      cta_link: slide.cta_link.trim(),
      sort_order: idx + 1,
      is_active: Boolean(slide.is_active),
    }));

    try {
      const { error: upsertError } = await supabase
        .from("hero_carousel_slides")
        .upsert(payload, { onConflict: "id" });

      if (upsertError) {
        throw upsertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchSlides();
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    }

    setSaving(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="font-bold tracking-[0.4em] text-sm uppercase mb-2">
              LOIS TECH Admin
            </h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase">
              Hero Slide Login
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl outline-none focus:border-zinc-600 transition-colors placeholder-zinc-600"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-white text-slate-950 text-xs tracking-[0.25em] uppercase font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-titillium px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-2">
              Admin Hero Slide Manager
            </p>
            <h1 className="text-3xl font-bold">Hero Carousel Slides</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push("/Admin")}
              className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              Back to Admin
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              View Shop
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              Manage up to 7 hero slide images for the shop page. Each slide is
              ordered from top to bottom by sort order. Use the active toggle to
              show or hide individual slides without deleting them.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              When you save, the shop page hero section will rotate through the
              active slides. Use image URLs for the large middle carousel.
            </p>
          </div>
        </div>

        {success && (
          <div className="rounded-3xl border border-emerald-500 bg-emerald-500/10 p-4 text-sm text-emerald-200 flex items-center gap-2">
            <CheckCircle size={16} />
            Hero slides saved successfully.
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Loading slides...
            </div>
          ) : (
            slides.map((slide, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-2">
                      Slide {idx + 1}
                    </p>
                    <p className="text-sm text-slate-400">
                      The order number is saved automatically. Add an image URL
                      and optional copy.
                    </p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={slide.is_active}
                      onChange={(e) =>
                        handleFieldChange(idx, "is_active", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500"
                    />
                    Active
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 mt-5">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Image URL</span>
                    <input
                      value={slide.image_url}
                      onChange={(e) =>
                        handleFieldChange(idx, "image_url", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="https://..."
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Headline</span>
                    <input
                      value={slide.headline}
                      onChange={(e) =>
                        handleFieldChange(idx, "headline", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="Main headline"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Eyebrow text</span>
                    <input
                      value={slide.eyebrow_text}
                      onChange={(e) =>
                        handleFieldChange(idx, "eyebrow_text", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="Top label"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Badge text</span>
                    <input
                      value={slide.badge_text}
                      onChange={(e) =>
                        handleFieldChange(idx, "badge_text", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="Badge or label"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Subheadline</span>
                    <input
                      value={slide.subheadline}
                      onChange={(e) =>
                        handleFieldChange(idx, "subheadline", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="Supporting text"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>CTA text</span>
                    <input
                      value={slide.cta_text}
                      onChange={(e) =>
                        handleFieldChange(idx, "cta_text", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="Button text"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
                    <span>CTA link</span>
                    <input
                      value={slide.cta_link}
                      onChange={(e) =>
                        handleFieldChange(idx, "cta_link", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                      placeholder="/shop or https://..."
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 hover:bg-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Hero Slides"}
          </button>
          <p className="text-xs text-slate-400 max-w-2xl">
            Save to update the hero carousel on the shop page. Only active
            slides with image URLs will show in the frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
