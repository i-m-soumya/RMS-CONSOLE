import { Bell, Menu, Store, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { NotificationItem, ViewId } from '../types';
import { Button } from './ui';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export function AppFrame({
  title,
  subtitle,
  unreadCount,
  navItems,
  active,
  onSelect,
  onLogout,
  onOpenNotifications,
  children,
}: {
  title: string;
  subtitle: string;
  unreadCount: number;
  navItems: NavItem[];
  active: ViewId;
  onSelect: (id: ViewId) => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  children: React.ReactNode;
  notifications?: NotificationItem[];
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const drawerClass = useMemo(
    () =>
      `fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white p-3 transition lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`,
    [mobileSidebarOpen],
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[18rem_1fr]">
        <aside className={drawerClass}>
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Store size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Console</p>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
              </div>
            </div>
            <Button variant="ghost" className="lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
              <X size={16} />
            </Button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const activeState = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    activeState ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {mobileSidebarOpen ? <button className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} aria-label="Close sidebar" /> : null}

        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 lg:hidden">
                  <Button variant="ghost" onClick={() => setMobileSidebarOpen(true)}>
                    <Menu size={18} />
                  </Button>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                </div>
                <p className="hidden text-sm font-semibold text-slate-900 lg:block">{title}</p>
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onOpenNotifications} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Notifications">
                  <Bell size={16} />
                  {unreadCount > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" /> : null}
                </button>
                <Button variant="secondary" className="hidden sm:inline-flex" onClick={onLogout}>Sign out</Button>
                <Button variant="secondary" className="sm:hidden" onClick={onLogout}>Out</Button>
              </div>
            </div>
          </header>
          <div className="flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
