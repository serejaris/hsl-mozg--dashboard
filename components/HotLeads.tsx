'use client';

import { useEffect, useState } from 'react';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Hottest Leads</h3>
        <div className="p-3 bg-red-50 rounded-lg">
          <Flame className="h-6 w-6 text-red-600" />
        </div>
      </div>
      <div className="space-y-3">
        {hotLeads.length > 0 ? (
          hotLeads.map((lead, index) => (
            <div key={lead.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getScoreIcon(lead.lead_score)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.first_name || lead.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lead.total_events} events • {lead.active_days} days
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No activity data available</p>
        )}
      </div>
    </div>
  );
}