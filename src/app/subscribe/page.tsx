"use client";

import { useState } from 'react';
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      setError('Could not subscribe, try again.');
    }
    setLoading(false);
  }

  if (done) return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold">You’re in 🎉</h1>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>Check your inbox—first alerts coming soon.</p>
            <a className="underline" href="/">Back to deals</a>
          </CardContent>
        </Card>
      </div>
    </main>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold">Get instant alerts</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                placeholder="you@example.com"
                label="Email address"
                hint="We’ll only email when there’s a great deal."
              />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={loading}>Subscribe</Button>
                <a href="/" className="text-sm text-gray-600 dark:text-gray-400 underline">Back to deals</a>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
