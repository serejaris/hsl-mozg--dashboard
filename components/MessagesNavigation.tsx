'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, History } from 'lucide-react';

const messagesNavigation = [
  { name: 'Отправить сообщение', href: '/messages/send', icon: Send },
  { name: 'История', href: '/messages/history', icon: History },
];

export default function MessagesNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-8">
        <nav className="flex space-x-8">
          {messagesNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
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