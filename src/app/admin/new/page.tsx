"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; id: string }
  | { state: "error"; message: string };

export default function NewDealPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [price, setPrice] = useState<string>("");
  const [link, setLink] = useState("");
  const [airline, setAirline] = useState("");
  const [dates, setDates] = useState("");
  const [tripType, setTripType] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ state: "submitting" });
    try {
      const payload = {
        origin_airport: origin,
        destination_airport: destination,
        price_gbp: Number(price),
        link,
        airline,
        outbound_dates: dates,
        trip_type: tripType,
      };
      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setStatus({ state: "error", message: json.error || `HTTP ${res.status}` });
      } else {
        setStatus({ state: "success", id: json.id || "" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus({ state: "error", message: msg });
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">New Deal</h1>
      {status.state === "success" ? (
        <div className="space-y-3">
          <p className="text-emerald-600">Deal created.</p>
          <div className="flex gap-3">
            <Link href="/admin" className="underline">Go to admin</Link>
            <Link href="/" className="underline">View deals</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Origin airport" placeholder="LHR" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
            <Input label="Destination airport" placeholder="JFK" value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Price (GBP)" type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input label="Trip type" placeholder="return/one-way" value={tripType} onChange={(e) => setTripType(e.target.value)} />
          </div>
          <Input label="Booking link" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Airline" placeholder="British Airways" value={airline} onChange={(e) => setAirline(e.target.value)} />
            <Input label="Dates" placeholder="Nov–Jan, weekends" value={dates} onChange={(e) => setDates(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={status.state === "submitting"}>Create deal</Button>
            <Link href="/admin" className="text-sm underline">Cancel</Link>
          </div>
          {status.state === "error" && (
            <p className="text-red-600 text-sm">{status.message}</p>
          )}
        </form>
      )}
    </main>
  );
}

