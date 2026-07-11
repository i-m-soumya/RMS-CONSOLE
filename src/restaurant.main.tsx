import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function RestaurantPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Restaurant Console</h1>
          <a className="text-sm underline" href="/index.html">Back</a>
        </header>
        <div className="grid md:grid-cols-3 gap-4">
          <article className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold">Admin</h2>
            <p className="text-sm text-slate-600 mt-1">Menu, staff, floors/tables, operating hours.</p>
          </article>
          <article className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold">Waiter</h2>
            <p className="text-sm text-slate-600 mt-1">Open session, confirm orders, generate bills.</p>
          </article>
          <article className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold">Kitchen</h2>
            <p className="text-sm text-slate-600 mt-1">Queue, preparing/ready updates, item rejection.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RestaurantPage />
  </StrictMode>
);
