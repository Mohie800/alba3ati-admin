"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, Save, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleItem {
  roleId: string;
  name: string;
  color: string;
  locked: boolean;
  price: number;
  mandatory: boolean;
}

type Draft = { locked: boolean; price: string };

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/roles", { suppressToast: true });
      const list: RoleItem[] = res.data.data.roles;
      setRoles(list);
      const d: Record<string, Draft> = {};
      list.forEach((r) => {
        d[r.roleId] = { locked: r.locked, price: String(r.price) };
      });
      setDrafts(d);
    } catch (e) {
      const err = e as { userMessage?: string };
      setError(err.userMessage || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchDraft = (roleId: string, patch: Partial<Draft>) =>
    setDrafts((p) => ({ ...p, [roleId]: { ...p[roleId], ...patch } }));

  // Toggle lock; seed a sensible default price when locking a previously-free
  // role so the admin isn't left with an invalid locked-but-price-0 state.
  const toggleLock = (roleId: string) =>
    setDrafts((p) => {
      const cur = p[roleId];
      if (!cur) return p;
      const nextLocked = !cur.locked;
      const price =
        nextLocked && (!cur.price || Number(cur.price) <= 0) ? "100" : cur.price;
      return { ...p, [roleId]: { locked: nextLocked, price } };
    });

  const isDirty = (r: RoleItem) => {
    const d = drafts[r.roleId];
    if (!d) return false;
    return d.locked !== r.locked || Number(d.price) !== r.price;
  };

  const isInvalid = (r: RoleItem) => {
    const d = drafts[r.roleId];
    if (!d) return false;
    const n = Number(d.price);
    if (Number.isNaN(n) || n < 0) return true;
    // A locked role needs a positive price to be purchasable.
    if (d.locked && n <= 0) return true;
    return false;
  };

  const save = async (r: RoleItem) => {
    const d = drafts[r.roleId];
    if (!d || isInvalid(r)) return;
    setSavingId(r.roleId);
    try {
      const res = await api.put(`/admin/roles/${r.roleId}`, {
        locked: d.locked,
        price: Number(d.price),
      });
      const updated: RoleItem = res.data.data.role;
      setRoles((prev) =>
        prev.map((x) => (x.roleId === r.roleId ? updated : x)),
      );
      setDrafts((p) => ({
        ...p,
        [r.roleId]: { locked: updated.locked, price: String(updated.price) },
      }));
    } catch {
      // Mutation errors are auto-toasted by the API interceptor.
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Lock game roles behind a coin price. A locked role can only be put into play by a host who owns it, and players can buy it from the role-selection screen."
      />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="text-destructive" size={28} />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => {
            const d = drafts[r.roleId];
            const dirty = isDirty(r);
            const invalid = isInvalid(r);
            const saving = savingId === r.roleId;
            const locked = d?.locked ?? r.locked;
            return (
              <Card key={r.roleId}>
                <CardContent className="flex flex-col gap-4">
                  {/* Identity */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-8 w-8 rounded-full shrink-0 border border-border"
                        style={{ backgroundColor: r.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate" dir="rtl">
                          {r.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          ID: {r.roleId}
                        </p>
                      </div>
                    </div>
                    {locked ? (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        <Lock size={11} /> Locked
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>

                  {r.mandatory ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      Core role — required every game, cannot be locked.
                    </p>
                  ) : (
                    <>
                      {/* Lock toggle */}
                      <Button
                        variant={locked ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => toggleLock(r.roleId)}
                      >
                        {locked ? <Lock size={14} /> : <Unlock size={14} />}
                        {locked ? "Locked (premium)" : "Unlocked (free)"}
                      </Button>

                      {/* Price */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Price (coins)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={d?.price ?? ""}
                          onChange={(e) =>
                            patchDraft(r.roleId, { price: e.target.value })
                          }
                          aria-invalid={invalid}
                        />
                        {invalid && (
                          <p className="text-[11px] text-destructive">
                            A locked role needs a price greater than 0.
                          </p>
                        )}
                      </div>

                      {/* Save */}
                      <Button
                        size="sm"
                        disabled={!dirty || invalid || saving}
                        onClick={() => save(r)}
                      >
                        {saving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
