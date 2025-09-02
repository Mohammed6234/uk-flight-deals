export function destinationBlurb(iata: string): string {
  const map: Record<string, string> = {
    DXB: 'Glittering skyline, warm winters, desert escapes.',
    BKK: 'Street food heaven, temples, and lively night markets.',
    KUL: 'Twin Towers views and diverse Malaysian cuisine.',
    JFK: 'Gateway to NYC—museums, Broadway, neighborhoods.',
    MCO: 'Theme parks central—Orlando magic for families.',
    SIN: 'Clean, green, and ultra-modern stopover paradise.',
  };
  return map[iata] ?? 'A popular destination with great value on select dates.';
}

