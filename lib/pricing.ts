type DiscountableProduct = {
  id?: string;
  price?: number | null;
  discount_percentage?: number | null;
  discount?: number | null;
};

const DISCOUNT_STORAGE_KEY = "lois-discounts";

export function getStoredDiscounts(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(DISCOUNT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getDiscountPercentage(
  product: DiscountableProduct | null | undefined,
  productId?: string
): number {
  const storedDiscounts = getStoredDiscounts();
  const localValue = productId ? storedDiscounts[productId] : undefined;
  const rawValue =
    product?.discount_percentage ??
    (product as DiscountableProduct & { discount?: number | null })?.discount ??
    localValue;

  const value = Number(rawValue ?? 0);
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getDiscountedPrice(
  price: number,
  discountPercentage: number | null | undefined
): number {
  const percentage = Number(discountPercentage ?? 0);
  if (!Number.isFinite(percentage) || percentage <= 0) return Math.round(price);
  return Math.max(0, Math.round(price * (1 - percentage / 100)));
}

export function clampDiscountPercentage(value: number | string | null | undefined): number {
  const percentage = Number(value ?? 0);
  if (!Number.isFinite(percentage)) return 0;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

export function formatCurrency(amount: number): string {
  return `₦${Math.max(0, amount).toLocaleString()}`;
}

export async function persistProductDiscount(
  productId: string,
  discountPercentage: number,
  supabaseClient?: any
) {
  const safeDiscount = clampDiscountPercentage(discountPercentage);

  if (typeof window !== "undefined") {
    const storedDiscounts = getStoredDiscounts();
    if (safeDiscount > 0) {
      storedDiscounts[productId] = safeDiscount;
    } else {
      delete storedDiscounts[productId];
    }
    window.localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(storedDiscounts));
  }

  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from("products")
      .update({ discount_percentage: safeDiscount > 0 ? safeDiscount : null })
      .eq("id", productId);

    if (error) {
      console.warn("Discount persistence skipped:", error.message);
    }
  } catch (error) {
    console.warn("Discount persistence skipped:", error);
  }
}
