'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Funnel', href: '/' },
  { name: 'Курсы', href: '/workshops' },
  { name: 'Messages', href: '/messages/send' },
  { name: 'Пользователи', href: '/users' },
  { name: 'Analytics', href: '/analytics' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2 py-1 text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
        {navigation.map((item) => {
          const isActive = item.name === 'Messages'
            ? pathname.startsWith('/messages')
            : pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors",
                isActive
                  ? 'bg-primary/15 text-foreground'
                  : 'hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
