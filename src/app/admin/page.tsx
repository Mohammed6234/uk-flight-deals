"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Deal = {
  id: string;
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  outbound_dates: string | null;
};

type NotifyResult = {
  ok?: boolean;
  sent?: number;
  failures?: Array<{ to: string; error: string }>;
  error?: string;
};

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function AdminPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/deals", { cache: "no-store" });
        const json = (await res.json()) as Deal[];
        if (!cancelled) setDeals(json);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendAlert(dealId: string) {
    setStatuses((s) => ({ ...s, [dealId]: { state: "sending" } }));
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const json = (await res.json()) as NotifyResult;
      if (!res.ok || json.error) {
        const msg = json.error || `HTTP ${res.status}`;
        setStatuses((s) => ({ ...s, [dealId]: { state: "error", message: msg } }));
      } else {
        const count = json.sent ?? 0;
        setStatuses((s) => ({ ...s, [dealId]: { state: "success", message: `Sent to ${count} subscribers` } }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatuses((s) => ({ ...s, [dealId]: { state: "error", message: msg } }));
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin · Deals</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Trigger subscriber alerts for recent deals.</p>
      </header>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : deals.length === 0 ? (
        <p className="text-sm text-gray-600">No published deals found.</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
          {deals.map((d) => {
            const st = statuses[d.id] || { state: "idle" };
            return (
              <li key={d.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {d.origin_airport} → {d.destination_airport}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span>£{d.price_gbp}</span>
                    {d.outbound_dates && <Badge tone="info">{d.outbound_dates}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {st.state === "success" && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{st.message}</span>
                  )}
                  {st.state === "error" && (
                    <span className="text-xs text-red-600">{st.message}</span>
                  )}
                  <Button onClick={() => sendAlert(d.id)} loading={st.state === "sending"}>
                    Send alert
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

