'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, History } from 'lucide-react';
import { cn } from '@/lib/utils';


const messagesNavigation = [
  { name: 'Отправить сообщение', href: '/messages/send', icon: Send },
  { name: 'История', href: '/messages/history', icon: History },
];

export default function MessagesNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto p-4">
        <nav className="flex gap-4">
          {messagesNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-colors",
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                <Icon className="mr-2" size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}