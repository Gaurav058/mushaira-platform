'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  Tag,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/organisers', icon: Building2, label: 'Organisers' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/events', icon: CalendarDays, label: 'All Events' },
  { href: '/categories', icon: Tag, label: 'Categories' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    auth.clear();
    router.push('/auth');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-navy flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="font-heading text-2xl text-gold font-bold tracking-wide">
          Mushaira
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <ShieldAlert size={12} className="text-gold/70" />
          <p className="text-xs text-white/50 font-medium">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-white/60 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-white/30 font-mono">SUPER_ADMIN</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
