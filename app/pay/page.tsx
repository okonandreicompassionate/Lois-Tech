"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, CheckCircle2 } from "lucide-react";

const OPAY_LOGO =
  "https://i.pinimg.com/736x/f6/92/23/f692231702deaeec08c5b21598142b65.jpg";

export default function PayPage() {
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem("pendingOrder");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-2">
            Payment details unavailable
          </p>
          <p className="text-xs text-zinc-400">
            Please return to checkout and try again.
          </p>
        </div>
      </div>
    );
  }

  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (clipboardError) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
      } catch (fallbackError) {
        console.error("Clipboard copy failed:", clipboardError, fallbackError);
        return false;
      }
    }
  };

  const copyAccount = async () => {
    const success = await copyTextToClipboard("6110252335");

    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      alert(
        "Copy failed. Please select the account number and copy it manually.",
      );
    }
  };

  const whatsappNumber = "2349053044754";
  const totalAmount =
    order?.total ?? (order?.subtotal || 0) + (order?.deliveryFee || 0);
  const whatsappMessage = encodeURIComponent(`
LoisTech Order Payment Confirmation

Name: ${order?.form?.name ?? "N/A"}
Phone: ${order?.form?.phone ?? "N/A"}
State: ${order?.form?.state ?? "N/A"}

Total: ₦${(totalAmount / 100).toLocaleString()}

I have completed payment to OPay account 6110252335.
Please confirm and update my order. I am attaching a screenshot of the payment.
`);

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-2">
            Payment details unavailable
          </p>
          <p className="text-xs text-zinc-400">
            Please return to the shop and try checkout again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs mb-3">
            Complete Payment
          </p>

          <h1 className="text-3xl font-bold">Bank Transfer</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
              Amount
            </p>

            <h2 className="text-4xl font-bold">
              ₦{(order.total / 100).toLocaleString()}
            </h2>
          </div>

          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                Service
              </p>

              <p className="text-lg font-medium">OPay Transfer</p>
            </div>

            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                OPay Account
              </p>

              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4">
                <span className="text-xl font-bold tracking-wider">
                  6110252335
                </span>

                <button
                  onClick={copyAccount}
                  className="text-zinc-400 hover:text-white"
                >
                  <Copy size={18} />
                </button>
              </div>

              {copied && (
                <p className="text-green-500 text-xs mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Copied
                </p>
              )}
            </div>

            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                Account Name
              </p>

              <p className="text-lg font-medium">
                LoisTech automation and integration services
              </p>
            </div>

            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                WhatsApp
              </p>

              <p className="text-lg font-medium">+2349053044754</p>
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center py-4 bg-white text-zinc-950 rounded-2xl font-semibold tracking-[0.2em] uppercase text-xs hover:bg-zinc-200 transition-colors"
          >
            I’ve Made Payment
          </a>

          <p className="text-zinc-600 text-xs text-center leading-relaxed">
            After payment, tap the button above and send your proof of payment
            on WhatsApp.
          </p>
        </div>

        <Link
          href="/shop"
          className="block text-center text-zinc-600 hover:text-white text-xs uppercase tracking-[0.2em] mt-6"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
