export function buildUnsubLink(email: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(
    email.trim().toLowerCase()
  )}`;
}

