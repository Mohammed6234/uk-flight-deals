export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-6">
        <p>
          We keep this simple. We collect your email address solely to send you UK flight deal alerts that you opted in to receive.
        </p>
        <ul>
          <li><strong>What we collect:</strong> your email address.</li>
          <li><strong>Why:</strong> to send flight alerts and occasional service updates.</li>
          <li>
            <strong>Unsubscribe:</strong> every email includes an unsubscribe link. You can also visit “Subscribe” and manage your preferences.
          </li>
          <li>
            <strong>Contact:</strong> email us at <a href="mailto:lastminukdeals@gmail.com">lastminukdeals@gmail.com</a> for any privacy queries.
          </li>
          <li>
            <strong>Data retention:</strong> we retain your email while you are subscribed. We will delete it on request or when you unsubscribe.
          </li>
        </ul>
        <p>
          We do not sell your data. We may use basic analytics to understand overall usage (e.g. page views) but not to build personal profiles.
        </p>
      </div>
    </main>
  );
}

