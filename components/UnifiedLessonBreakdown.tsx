'use client';

import { format } from 'date-fns';

interface LessonConversionStats {
  lesson_type: string;
  registrations: number;
  attendances: number;
  conversion_rate: number;
}

interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
  lesson_date: string;
}

interface UnifiedLessonBreakdownProps {
  registrations: FreeLessonRegistration[];
  conversionData?: LessonConversionStats[];
}

export default function UnifiedLessonBreakdown({ registrations, conversionData = [] }: UnifiedLessonBreakdownProps) {
  // Group registrations by lesson type and lesson date
  const groupedData = registrations.reduce((acc, reg) => {
    const lessonType = reg.lesson_type || 'Unknown';
    const lessonDate = reg.lesson_date && reg.lesson_date !== 'N/A' ? reg.lesson_date : 'Дата не указана';
    
    if (!acc[lessonType]) {
      acc[lessonType] = {
        totalCount: 0,
        dates: {}
      };
    }
    
    acc[lessonType].totalCount++;
    
    if (!acc[lessonType].dates[lessonDate]) {
      acc[lessonType].dates[lessonDate] = 0;
    }
    
    acc[lessonType].dates[lessonDate]++;
    
    return acc;
  }, {} as Record<string, { totalCount: number; dates: Record<string, number> }>);

  // Sort lesson types by total registrations
  const sortedLessonTypes = Object.entries(groupedData)
    .sort(([, a], [, b]) => b.totalCount - a.totalCount);

  // Helper function to get conversion data for a lesson type
  const getConversionData = (lessonType: string) => {
    return conversionData.find(c => c.lesson_type === lessonType);
  };

  if (sortedLessonTypes.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 text-center text-sm text-muted-foreground">
        Нет данных о регистрациях
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-none">
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {sortedLessonTypes.map(([lessonType, data]) => {
            // Sort dates from newest to oldest, handling 'Дата не указана'
            const sortedDates = Object.entries(data.dates)
              .sort(([a], [b]) => {
                if (a === 'Дата не указана') return 1;
                if (b === 'Дата не указана') return -1;
                return b.localeCompare(a);
              });
            
            const conversionInfo = getConversionData(lessonType);
            
            return (
              <div key={lessonType} className="overflow-hidden rounded-lg border border-border/60 bg-card/60">
                {/* Header with lesson type and total count */}
                <div className="border-b border-border/50 bg-muted/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{lessonType}</h3>
                      {conversionInfo && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{conversionInfo.attendances}</span> присоединились из{' '}
                          <span className="font-medium text-primary">{conversionInfo.registrations}</span> записавшихся 
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {conversionInfo.conversion_rate}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {data.totalCount} регистраций
                    </span>
                  </div>
                </div>
                
                {/* Dates breakdown table */}
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <span>Дата проведения</span>
                      <span>Записалось</span>
                    </div>
                    {sortedDates.map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0">
                        <span className="text-sm text-foreground">
                          {date === 'Дата не указана' ? date : format(new Date(date), 'dd.MM.yyyy')}
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
