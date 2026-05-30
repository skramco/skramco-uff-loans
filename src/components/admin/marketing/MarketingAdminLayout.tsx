import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  FileText,
  Settings,
  BarChart3,
  LogOut,
  Megaphone,
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

const navItems = [
  { to: '/admin/marketing', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/marketing/campaigns', label: 'Campaigns', icon: Mail },
  { to: '/admin/marketing/templates', label: 'Templates', icon: FileText },
  { to: '/admin/marketing/settings', label: 'Settings', icon: Settings },
  { to: '/admin/marketing/metrics', label: 'Metrics', icon: BarChart3 },
];

export default function MarketingAdminLayout({ onLogout }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-indigo-400" />
            <div>
              <h1 className="text-lg font-semibold">UFF Marketing Automation</h1>
              <p className="text-xs text-slate-400">United Fidelity Funding / PRO Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <nav className="hidden w-52 shrink-0 flex-col gap-1 md:flex">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
