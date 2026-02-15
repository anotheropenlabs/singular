'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Users,
  Link2,
  Activity,
  FileText,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbounds', label: 'Inbounds', icon: Server },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/subscriptions', label: 'Subscriptions', icon: Link2 },
  { href: '/connections', label: 'Connections', icon: Activity },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white/5 backdrop-blur-xl border-r border-white/10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">
          Sing<span className="text-blue-400">UI</span>
        </h1>
      </div>
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
