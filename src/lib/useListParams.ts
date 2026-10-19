"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Params<T> = { [K in keyof T]: string };

function readUrl<T extends Record<string, string>>(defaults: T): Params<T> {
  const out = { ...defaults };
  if (typeof window === "undefined") return out;
  const sp = new URLSearchParams(window.location.search);
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const v = sp.get(key as string);
    if (v !== null) out[key] = v as T[keyof T];
  }
  return out;
}

/**
 * List filters/page/sort kept in the URL query string, so opening a row and
 * pressing back restores the same view (and links can be shared).
 * Uses window.history directly to avoid useSearchParams' Suspense requirement.
 */
export function useListParams<T extends Record<string, string>>(defaults: T) {
  // Defaults are a literal per page; freeze the first value
  const [initial] = useState(defaults);
  const [params, setParams] = useState<Params<T>>(initial);
  // False until the URL has been read; fetch only after, or defaults load first
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // URL is read after mount so the first render matches the server HTML
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams(readUrl(initial));
    setReady(true);
    const onPop = () => setParams(readUrl(initial));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initial]);

  const write = useCallback(
    (next: Params<T>) => {
      const sp = new URLSearchParams(window.location.search);
      for (const key of Object.keys(initial)) {
        const v = next[key as keyof T];
        if (v === initial[key as keyof T] || v === "") sp.delete(key);
        else sp.set(key, v);
      }
      const qs = sp.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(window.history.state, "", url);
      try {
        sessionStorage.setItem(`listUrl:${window.location.pathname}`, url);
      } catch {
        /* storage unavailable: back links fall back to the bare list */
      }
    },
    [initial],
  );

  /** Any change other than `page` sends you back to page 1 */
  const set = useCallback(
    (patch: Partial<Params<T>>) => {
      setParams((prev) => {
        const next = { ...prev, ...patch };
        if ("page" in initial && !("page" in patch)) {
          (next as Record<string, string>).page = initial.page;
        }
        write(next);
        return next;
      });
    },
    [initial, write],
  );

  const reset = useCallback(() => {
    setParams(initial);
    write(initial);
  }, [initial, write]);

  const activeCount = useMemo(
    () =>
      (Object.keys(initial) as (keyof T)[]).filter(
        (k) => k !== "page" && k !== "sort" && params[k] !== initial[k],
      ).length,
    [params, initial],
  );

  return { params, set, reset, activeCount, ready };
}

/** Wraps a fetch so only the most recent call may apply its result */
export function useLatest() {
  const counter = useRef(0);
  return useCallback(() => {
    const id = ++counter.current;
    return () => id === counter.current;
  }, []);
}

/** Builds API query params, dropping defaults like "all" and empty strings */
export function toQuery(
  params: Record<string, string>,
  skip: string[] = ["all", ""],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (!skip.includes(v)) out[k] = v;
  }
  return out;
}

/** Last filtered URL of a list page, for "Back to …" links */
export function rememberedListUrl(path: string) {
  try {
    return sessionStorage.getItem(`listUrl:${path}`) || path;
  } catch {
    return path;
  }
}
