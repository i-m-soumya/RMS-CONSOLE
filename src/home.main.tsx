import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 p-6 md:p-10">
      <section className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">RMS Console</h1>
        <p className="text-slate-600">Select the console you need. This is a multi-page app to keep navigation simple and reliable.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a className="border rounded-xl p-5 hover:bg-slate-50" href="/platform.html">
            <h2 className="font-semibold">Platform Console</h2>
            <p className="text-sm text-slate-600 mt-1">Onboarding, restaurants, and platform operations.</p>
          </a>
          <a className="border rounded-xl p-5 hover:bg-slate-50" href="/restaurant.html">
            <h2 className="font-semibold">Restaurant Console</h2>
            <p className="text-sm text-slate-600 mt-1">Admin, waiter, and kitchen day-to-day workflows.</p>
          </a>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>
);
