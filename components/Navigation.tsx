'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  FileText,
  Users,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Funnel', href: '/', icon: LayoutDashboard },
  { name: 'Курсы', href: '/workshops', icon: Calendar },
  { name: 'Messages', href: '/messages/send', icon: MessageSquare },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Content', href: '/content', icon: FileText },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-foreground">HSL Dashboard</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.name === 'Messages' 
                  ? pathname.startsWith('/messages') 
                  : pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}