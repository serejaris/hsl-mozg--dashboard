'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Flame } from 'lucide-react';

interface UserActivity {
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  total_events: number;
  active_days: number;
  last_activity: string;
  lead_score: 'hot' | 'warm' | 'cool' | 'cold';
}

export default function HotLeads() {
  const [hotLeads, setHotLeads] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user-activity')
      .then(res => res.json())
      .then(data => {
        // Get top 5 hottest leads
        setHotLeads(data.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch hot leads:', err);
        setLoading(false);
      });
  }, []);

  const getScoreIcon = (score: string) => {
    switch(score) {
      case 'hot': return '🔥';
      case 'warm': return '🟡';
      case 'cool': return '🔵';
      default: return '❄️';
    }
  };

  const getTelegramLink = (username: string) => {
    if (!username || username === 'N/A') return null;
    const cleanUsername = username.replace('@', '');
    return `https://t.me/${cleanUsername}`;
  };

  const CardShell = ({ children }: { children: ReactNode }) => (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-none">
      {children}
    </div>
  );

  if (loading) {
    return (
      <CardShell>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-3 rounded bg-muted" />
            <div className="h-3 rounded bg-muted" />
          </div>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Активные лиды</h3>
        <div className="rounded-lg bg-primary/5 p-2 text-primary">
          <Flame className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-4">
        {hotLeads.length > 0 ? (
          hotLeads.map((lead, index) => {
            const telegramLink = getTelegramLink(lead.username);
            return (
              <div
                key={`${lead.user_id}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getScoreIcon(lead.lead_score)}</span>
                  <div>
                    {telegramLink ? (
                      <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {lead.first_name || lead.username} 📱
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {lead.first_name || lead.username}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {lead.total_events} событий • {lead.active_days} дней
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">Нет данных активности</p>
        )}
      </div>
    </CardShell>
  );
}
