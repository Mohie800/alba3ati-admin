"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "error" | "success" | "info";

export interface ToastPayload {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastPayload, "durationMs">> {
  id: number;
  durationMs: number;
}

const DEFAULT_DURATION = 4500;

export function toast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>("admin-toast", { detail: payload }),
  );
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 1;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      const item: ToastItem = {
        id: nextId++,
        message: detail.message,
        variant: detail.variant ?? "error",
        durationMs: detail.durationMs ?? DEFAULT_DURATION,
      };
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, item.durationMs);
    };
    window.addEventListener("admin-toast", handler);
    return () => window.removeEventListener("admin-toast", handler);
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-lg border px-3.5 py-2.5 shadow-lg backdrop-blur min-w-[260px] max-w-sm text-sm",
            t.variant === "error" &&
              "border-destructive/40 bg-destructive/10 text-destructive",
            t.variant === "success" &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            t.variant === "info" && "border-border bg-card text-foreground",
          )}
        >
          {t.variant === "error" && (
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
          )}
          {t.variant === "success" && (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
