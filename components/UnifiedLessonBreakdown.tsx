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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика по урокам</h2>
        <div className="text-gray-500 text-center py-8">Нет данных о регистрациях</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Статистика по урокам</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div key={lessonType} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header with lesson type and total count */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{lessonType}</h3>
                      {conversionInfo && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="font-medium text-green-600">{conversionInfo.attendances}</span> присоединились из{' '}
                          <span className="font-medium text-blue-600">{conversionInfo.registrations}</span> записавшихся 
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {conversionInfo.conversion_rate}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {data.totalCount} регистраций
                    </span>
                  </div>
                </div>
                
                {/* Dates breakdown table */}
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <span>Дата проведения</span>
                      <span>Записалось</span>
                    </div>
                    {sortedDates.map(([date, count]) => (
                      <div key={date} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm text-gray-900">
                          {date === 'Дата не указана' ? date : format(new Date(date), 'dd.MM.yyyy')}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
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