// simple, no-key image source (Unsplash public source URLs)
export function destinationImageUrl(iata: string): string {
  // fallback to city/region keyword guesses
  return `https://source.unsplash.com/featured/1600x900/?travel,${encodeURIComponent(iata)}`;
}

