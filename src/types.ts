export interface Deal {
  id?: string;
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  airline?: string | null;
  trip_type?: string | null; // 'return' | 'one-way'
  outbound_dates?: string | null; // "Nov 10–20" or "Jan–Feb"
  link: string;
  source?: string | null;
  found_at?: string; // timestamptz
  expires_at?: string | null;
  is_published: boolean;
}

export interface AirportSummary {
  origin_airport: string;
  deal_count: number;
}

